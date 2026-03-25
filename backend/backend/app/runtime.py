from __future__ import annotations

import asyncio
import contextlib
import logging
import random
import time
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from fastapi import WebSocket

from backend.app.protocol import parse_client_message
from backend.classifiers.base import ClassificationResult, GestureClassifier
from backend.classifiers.heuristic import HeuristicGestureClassifier
from backend.cv.features import extract_feature_bundle
from backend.cv.hand_tracker import HandTracker
from backend.game.simulation import SIMULATION_PREDICTIONS
from backend.game.state import RoundManager

LOGGER = logging.getLogger(__name__)
FEATURE_VERSION = 1


@dataclass(slots=True)
class LatestFrame:
    payload: bytes
    received_at: float
    sequence: int


@dataclass(slots=True)
class SmoothedPrediction:
    label: str
    confidences: dict[str, float]
    stable: bool


class PredictionSmoother:
    def __init__(self, window_size: int = 7) -> None:
        self.window_size = window_size
        self.window: deque[ClassificationResult] = deque(maxlen=window_size)

    def reset(self) -> None:
        self.window.clear()

    def add(self, result: ClassificationResult) -> SmoothedPrediction:
        self.window.append(result)
        averages = {
            move: sum(item.confidences.get(move, 0.0) for item in self.window) / len(self.window)
            for move in ("rock", "paper", "scissors")
        }
        top_label = max(averages, key=averages.get)
        top_confidence = averages[top_label]
        stable_votes = sum(item.label == top_label and item.stable_candidate for item in self.window)
        stable = top_confidence >= 0.75 and stable_votes >= 5
        label = top_label if top_confidence >= 0.60 else "unknown"
        return SmoothedPrediction(label=label, confidences=averages, stable=stable)


class AppRuntime:
    def __init__(
        self,
        *,
        auto_reveal_delay: float = 0.6,
        auto_result_delay: float = 0.9,
        auto_reset_delay: float = 2.4,
        auto_start_hold_seconds: float = 2.0,
    ) -> None:
        self.manager = RoundManager()
        self.hand_tracker = HandTracker()
        self.heuristic_classifier = HeuristicGestureClassifier()
        self.learned_classifier: GestureClassifier | None = None
        self.model_loaded = False
        self.fallback_reason = "Learned model not loaded"
        self.websockets: set[WebSocket] = set()
        self.smoother = PredictionSmoother()
        self.latest_frame: LatestFrame | None = None
        self.frame_sequence = 0
        self.last_processed_sequence = -1
        self.last_frame_received_at: float | None = None
        self.frame_loop_task: asyncio.Task[None] | None = None
        self.health_loop_task: asyncio.Task[None] | None = None
        self.autoplay_task: asyncio.Task[None] | None = None
        self.countdown_task: asyncio.Task[None] | None = None
        self.state_lock = asyncio.Lock()
        self.auto_reveal_delay = auto_reveal_delay
        self.auto_result_delay = auto_result_delay
        self.auto_reset_delay = auto_reset_delay
        self.auto_start_hold_seconds = auto_start_hold_seconds
        self.auto_start_move: str | None = None
        self.auto_start_started_at: float | None = None
        self.auto_start_pending = False

    async def startup(self) -> None:
        self._load_classifiers()
        if self.hand_tracker.available:
            self.manager.set_mode("live_cv")
        else:
            self.manager.set_mode("simulate")
        self.manager.set_classifier_status(
            requested="auto",
            active="learned" if self.learned_classifier else "heuristic",
            model_loaded=self.model_loaded,
            fallback_reason=self.fallback_reason,
        )
        self.manager.update_health(
            message=None if self.hand_tracker.available else self.hand_tracker.reason
        )
        self.frame_loop_task = asyncio.create_task(self._frame_loop())
        self.health_loop_task = asyncio.create_task(self._health_loop())

    async def shutdown(self) -> None:
        for task in (
            self.frame_loop_task,
            self.health_loop_task,
            self.autoplay_task,
            self.countdown_task,
        ):
            if task is not None:
                task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await task
        self.hand_tracker.close()

    def _load_classifiers(self) -> None:
        from backend.classifiers.learned import LearnedLandmarkClassifier, load_validated_model

        model_path = Path(__file__).resolve().parents[2] / "models" / "gesture_model.joblib"
        metadata_path = Path(__file__).resolve().parents[2] / "models" / "gesture_model.metadata.json"
        loaded = load_validated_model(model_path, metadata_path, FEATURE_VERSION)
        if loaded is None:
            self.learned_classifier = None
            self.model_loaded = False
            self.fallback_reason = "Validated model artifact missing or incompatible"
            return
        self.learned_classifier = LearnedLandmarkClassifier(
            model=loaded.model,
            metadata=loaded.metadata,
        )
        self.model_loaded = True
        self.fallback_reason = None

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.websockets.add(websocket)
        self.manager.set_client_count(len(self.websockets))
        await self._send_json(websocket, {"type": "connection_status", "connected": True})
        await self._send_json(
            websocket,
            {"type": "classifier_status", "status": self.manager.state.classifier_status.to_dict()},
        )
        await self._send_json(websocket, {"type": "health_status", "health": self.manager.state.health.to_dict()})
        await self._send_json(websocket, {"type": "state_snapshot", "state": self.manager.snapshot()})

    async def disconnect(self, websocket: WebSocket) -> None:
        self.websockets.discard(websocket)
        self.manager.set_client_count(len(self.websockets))

    async def handle_text(self, websocket: WebSocket, payload: str) -> None:
        try:
            message = parse_client_message(payload)
        except Exception as exc:  # pragma: no cover - exercised in integration flow
            LOGGER.warning("Invalid client message: %s", exc)
            await self._send_json(websocket, {"type": "error", "message": "Invalid message"})
            return

        message_type = getattr(message, "type")
        if message_type == "hello":
            await self._send_json(websocket, {"type": "debug_ack", "message": "hello back"})
            await self._send_snapshot(websocket)
            return

        if message_type == "request_state":
            await self._send_snapshot(websocket)
            return

        if message_type == "set_mode":
            await self._handle_set_mode(message.mode)
            return

        if message_type == "reset_round":
            await self._cancel_tasks()
            await self._reset_round_state()
            await self._broadcast_phase_snapshot()
            return

        if message_type == "advance_round":
            await self._handle_advance_round()
            return

        if message_type == "start_autoplay":
            await self._start_autoplay()
            await self._send_json(websocket, {"type": "debug_ack", "message": "autoplay started"})
            return

        if message_type == "stop_autoplay":
            await self._stop_autoplay(reset=True)
            await self._send_json(websocket, {"type": "debug_ack", "message": "autoplay stopped"})
            return

        command_payload: dict[str, Any]
        if message_type == "presenter_override":
            command_payload = dict(message.payload)
        else:
            command_payload = dict(message.command)
            if command_payload.get("action") == "set_prediction_override":
                command_payload["action"] = "set_prediction"
        await self._handle_presenter_command(command_payload)
        await self._send_json(
            websocket,
            {"type": "debug_ack", "message": f"override: {command_payload.get('action', 'unknown')}"},
        )

    async def handle_binary(self, payload: bytes) -> None:
        async with self.state_lock:
            self.frame_sequence += 1
            self.latest_frame = LatestFrame(
                payload=payload,
                received_at=time.monotonic(),
                sequence=self.frame_sequence,
            )
            self.last_frame_received_at = self.latest_frame.received_at

    async def health_snapshot(self) -> dict[str, object]:
        async with self.state_lock:
            return self.manager.state.health.to_dict()

    async def debug_snapshot(self) -> dict[str, object]:
        async with self.state_lock:
            state = self.manager.snapshot()
            state["frameSequence"] = self.frame_sequence
            state["trackerAvailable"] = self.hand_tracker.available
            return state

    async def _handle_set_mode(self, mode: str) -> None:
        await self._cancel_tasks()
        async with self.state_lock:
            self.smoother.reset()
            self._clear_auto_start_tracking()
            self.manager.set_mode(mode)  # type: ignore[arg-type]
            self.manager.update_health(message=None)
        await self._broadcast_json({"type": "mode_update", "mode": mode})
        await self._broadcast_phase_snapshot()

    async def _handle_advance_round(self) -> None:
        async with self.state_lock:
            phase = self.manager.state.phase
            mode = self.manager.state.mode

        if phase in {"idle", "waiting_for_hand", "hand_detected", "predicting"}:
            if mode == "simulate":
                async with self.state_lock:
                    if not self.manager.state.hand_detected:
                        self.manager.set_hand_detected(True)
                    if self.manager.state.predicted_move is None:
                        seed = SIMULATION_PREDICTIONS[-1]
                        self.manager.apply_prediction(
                            move=seed.move,
                            confidences=seed.confidences,
                            stable=True,
                            source="simulation",
                        )
                await self._broadcast_hand_status()
                await self._broadcast_prediction()
            await self._start_countdown()
            return

        if phase == "locked":
            await self._handle_presenter_command({"action": "trigger_reveal"})
            return

        if phase == "reveal":
            await self._handle_presenter_command({"action": "trigger_result"})
            return

        if phase == "result":
            await self._handle_presenter_command({"action": "reset"})

    async def _handle_presenter_command(self, command: dict[str, Any]) -> None:
        action = str(command.get("action"))
        if action == "set_mode":
            await self._handle_set_mode(str(command["mode"]))
            return

        if action == "set_hand_detected":
            async with self.state_lock:
                self.manager.set_hand_detected(bool(command["detected"]))
            await self._broadcast_hand_status()
            await self._broadcast_phase_snapshot()
            return

        if action in {"set_prediction", "set_prediction_override"}:
            move = str(command["move"])
            confidences = {
                "rock": float(command["confidences"]["rock"]),
                "paper": float(command["confidences"]["paper"]),
                "scissors": float(command["confidences"]["scissors"]),
            }
            async with self.state_lock:
                self.manager.set_prediction_override(move, confidences)
                if move in {"rock", "paper", "scissors"}:
                    self.manager.apply_prediction(
                        move=move,
                        confidences=confidences,
                        stable=True,
                        source="presenter",
                    )
            await self._broadcast_prediction()
            await self._broadcast_snapshot()
            return

        if action == "clear_prediction_override":
            async with self.state_lock:
                self.manager.clear_prediction_override()
            await self._broadcast_prediction()
            await self._broadcast_snapshot()
            return

        if action == "start_countdown":
            await self._start_countdown()
            return

        if action == "set_computer_move":
            async with self.state_lock:
                self.manager.set_computer_move(str(command["move"]))  # type: ignore[arg-type]
            await self._broadcast_json({"type": "computer_move", "move": command["move"]})
            await self._broadcast_snapshot()
            return

        if action == "trigger_reveal":
            async with self.state_lock:
                if self.manager.state.computer_move is None:
                    self.manager.set_computer_move(random.choice(["rock", "paper", "scissors"]))
                self.manager.trigger_reveal()
                computer_move = self.manager.state.computer_move
            await self._broadcast_json({"type": "computer_move", "move": computer_move})
            await self._broadcast_phase_snapshot()
            return

        if action == "trigger_result":
            async with self.state_lock:
                result = self.manager.trigger_result()
                score = dict(self.manager.state.score)
            if result is not None:
                await self._broadcast_phase()
                await self._broadcast_json({"type": "round_result", "result": result})
                await self._broadcast_json({"type": "score_update", "score": score})
                await self._broadcast_snapshot()
            return

        if action == "reset":
            await self._cancel_tasks()
            await self._reset_round_state()
            await self._broadcast_phase_snapshot()

    async def _start_countdown(self) -> None:
        if self.countdown_task is not None and not self.countdown_task.done():
            return
        self._clear_auto_start_tracking()
        self.countdown_task = asyncio.create_task(self._run_countdown())

    async def _run_countdown(self) -> None:
        async with self.state_lock:
            locked_move = self.manager.start_countdown()
            if locked_move is None:
                self.manager.update_health(message="Hold one stable gesture before starting")
                phase = self.manager.state.phase
            else:
                count = self.manager.state.countdown_value
                phase = self.manager.state.phase
        if locked_move is None:
            await self._broadcast_json(
                {"type": "error", "message": "Hold one stable gesture before starting the timer."}
            )
            await self._broadcast_json({"type": "phase_change", "phase": phase})
            await self._broadcast_snapshot()
            return

        await self._broadcast_phase()
        await self._broadcast_json({"type": "countdown_update", "count": count})
        await self._broadcast_snapshot()

        for count in (2, 1):
            await asyncio.sleep(1)
            async with self.state_lock:
                self.manager.set_countdown_value(count)
            await self._broadcast_json({"type": "countdown_update", "count": count})
            await self._broadcast_snapshot()

        await asyncio.sleep(1)
        async with self.state_lock:
            locked_move = self.manager.lock_current_move()

        await self._broadcast_phase()
        await self._broadcast_json({"type": "round_locked", "playerMove": locked_move})
        await self._broadcast_snapshot()
        await self._auto_complete_round()

    def _clear_auto_start_tracking(self) -> None:
        self.auto_start_move = None
        self.auto_start_started_at = None
        self.auto_start_pending = False

    def _update_auto_start_tracking(self, now: float) -> bool:
        state = self.manager.state
        if state.mode != "live_cv" or state.phase not in {"waiting_for_hand", "hand_detected", "predicting"}:
            self._clear_auto_start_tracking()
            return False

        locked_candidate = state.lockable_move()
        if locked_candidate is None:
            self._clear_auto_start_tracking()
            return False

        if self.auto_start_pending:
            return False

        if locked_candidate != self.auto_start_move:
            self.auto_start_move = locked_candidate
            self.auto_start_started_at = now
            return False

        if self.auto_start_started_at is None:
            self.auto_start_started_at = now
            return False

        if now - self.auto_start_started_at >= self.auto_start_hold_seconds:
            self.auto_start_pending = True
            return True

        return False

    async def _auto_complete_round(self) -> None:
        await asyncio.sleep(self.auto_reveal_delay)

        computer_move: str | None = None
        should_reveal = False
        async with self.state_lock:
            if self.manager.state.phase == "locked":
                if self.manager.state.computer_move is None:
                    self.manager.set_computer_move(random.choice(["rock", "paper", "scissors"]))
                self.manager.trigger_reveal()
                computer_move = self.manager.state.computer_move
                should_reveal = True
        if should_reveal:
            await self._broadcast_json({"type": "computer_move", "move": computer_move})
            await self._broadcast_phase_snapshot()

        await asyncio.sleep(self.auto_result_delay)

        result: dict[str, object] | None = None
        score: dict[str, int] | None = None
        async with self.state_lock:
            if self.manager.state.phase == "reveal":
                result = self.manager.trigger_result()
                if result is not None:
                    score = dict(self.manager.state.score)
        if result is not None and score is not None:
            await self._broadcast_phase()
            await self._broadcast_json({"type": "round_result", "result": result})
            await self._broadcast_json({"type": "score_update", "score": score})
            await self._broadcast_snapshot()

        await asyncio.sleep(self.auto_reset_delay)

        async with self.state_lock:
            should_reset = self.manager.state.phase == "result"
        if should_reset:
            await self._reset_round_state()
            await self._broadcast_phase_snapshot()

    async def _start_autoplay(self) -> None:
        async with self.state_lock:
            if self.manager.state.mode != "simulate":
                self.manager.set_mode("simulate")
        await self._stop_autoplay(reset=False)
        self.autoplay_task = asyncio.create_task(self._run_autoplay())
        await self._broadcast_json({"type": "mode_update", "mode": "simulate"})
        await self._broadcast_snapshot()

    async def _stop_autoplay(self, *, reset: bool) -> None:
        if self.autoplay_task is not None:
            self.autoplay_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self.autoplay_task
        self.autoplay_task = None
        if reset:
            await self._reset_round_state()
            await self._broadcast_phase_snapshot()

    async def _run_autoplay(self) -> None:
        await self._reset_round_state(reset_smoother=False)
        await self._broadcast_phase_snapshot()
        while True:
            await asyncio.sleep(1.0)

            async with self.state_lock:
                self.manager.set_hand_detected(True)
            await self._broadcast_hand_status()
            await self._broadcast_phase()
            await asyncio.sleep(0.6)

            for prediction in SIMULATION_PREDICTIONS:
                async with self.state_lock:
                    self.manager.apply_prediction(
                        move=prediction.move,
                        confidences=prediction.confidences,
                        stable=True,
                        source="simulation",
                    )
                await self._broadcast_prediction()
                await self._broadcast_snapshot()
                await asyncio.sleep(0.45)

            await self._run_countdown()

    async def _frame_loop(self) -> None:
        while True:
            await asyncio.sleep(0.05)
            async with self.state_lock:
                frame = self.latest_frame
                mode = self.manager.state.mode

            if mode != "live_cv" or frame is None or frame.sequence == self.last_processed_sequence:
                continue

            self.last_processed_sequence = frame.sequence
            if not self.hand_tracker.available:
                async with self.state_lock:
                    self._clear_auto_start_tracking()
                    self.manager.set_hand_detected(False)
                    self.manager.update_health(message=self.hand_tracker.reason)
                await self._broadcast_hand_status()
                await self._broadcast_phase()
                await self._broadcast_health()
                continue

            decoded = cv2.imdecode(np.frombuffer(frame.payload, dtype=np.uint8), cv2.IMREAD_COLOR)
            if decoded is None:
                continue

            observation = self.hand_tracker.detect(decoded)
            if observation is None:
                async with self.state_lock:
                    self.smoother.reset()
                    self._clear_auto_start_tracking()
                    self.manager.set_hand_detected(False)
                    self.manager.apply_prediction(
                        move="unknown",
                        confidences={"rock": 0.0, "paper": 0.0, "scissors": 0.0},
                        stable=False,
                        source="live_cv",
                    )
                    self.manager.update_health(message="No hand detected")
                await self._broadcast_hand_status()
                await self._broadcast_prediction()
                await self._broadcast_phase()
                await self._broadcast_snapshot()
                continue

            bundle = extract_feature_bundle(observation.landmarks, observation.handedness)
            classifier = self.learned_classifier or self.heuristic_classifier
            result = classifier.predict(bundle)
            smoothed = self.smoother.add(result)
            should_auto_start = False
            async with self.state_lock:
                self.manager.set_hand_detected(True)
                self.manager.apply_prediction(
                    move=smoothed.label,
                    confidences=smoothed.confidences,
                    stable=smoothed.stable,
                    source="live_cv",
                )
                self.manager.update_health(message=None)
                should_auto_start = self._update_auto_start_tracking(time.monotonic())
            await self._broadcast_hand_status()
            await self._broadcast_prediction()
            await self._broadcast_phase()
            await self._broadcast_snapshot()
            if should_auto_start:
                await self._start_countdown()

    async def _health_loop(self) -> None:
        while True:
            await asyncio.sleep(1.0)
            stale_transition = False
            async with self.state_lock:
                frame_age_ms = (
                    int((time.monotonic() - self.last_frame_received_at) * 1000)
                    if self.last_frame_received_at is not None
                    else None
                )
                message = None
                if self.manager.state.mode == "live_cv" and frame_age_ms is not None and frame_age_ms > 1500:
                    self.smoother.reset()
                    self._clear_auto_start_tracking()
                    stale_transition = self.manager.state.hand_detected
                    self.manager.set_hand_detected(False)
                    if self.manager.state.phase not in {"countdown", "locked", "reveal", "result"}:
                        self.manager.state.phase = "waiting_for_hand"
                        stale_transition = True
                    message = "Camera frames stale"
                self.manager.update_health(frame_age_ms=frame_age_ms, message=message)
            if stale_transition:
                await self._broadcast_hand_status()
                await self._broadcast_prediction()
                await self._broadcast_phase_snapshot()
            await self._broadcast_health()

    async def _cancel_tasks(self) -> None:
        if self.countdown_task is not None:
            self.countdown_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self.countdown_task
            self.countdown_task = None
        if self.autoplay_task is not None:
            self.autoplay_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self.autoplay_task
            self.autoplay_task = None

    async def _reset_round_state(self, *, reset_smoother: bool = True) -> None:
        async with self.state_lock:
            if reset_smoother:
                self.smoother.reset()
            self._clear_auto_start_tracking()
            self.manager.reset_round()

    async def _broadcast_phase_snapshot(self) -> None:
        await self._broadcast_phase()
        await self._broadcast_snapshot()

    async def _broadcast_snapshot(self) -> None:
        await self._broadcast_json({"type": "state_snapshot", "state": self.manager.snapshot()})

    async def _broadcast_phase(self) -> None:
        await self._broadcast_json({"type": "phase_change", "phase": self.manager.state.phase})

    async def _broadcast_hand_status(self) -> None:
        await self._broadcast_json({"type": "hand_status", "detected": self.manager.state.hand_detected})

    async def _broadcast_prediction(self) -> None:
        snapshot = self.manager.snapshot()
        await self._broadcast_json(
            {
                "type": "prediction_update",
                "move": snapshot["predictedMove"] or "unknown",
                "confidences": snapshot["confidences"],
                "stable": snapshot["predictionStable"],
                "source": snapshot["predictionSource"],
            }
        )

    async def _broadcast_health(self) -> None:
        await self._broadcast_json({"type": "health_status", "health": self.manager.state.health.to_dict()})

    async def _broadcast_json(self, payload: dict[str, object]) -> None:
        if not self.websockets:
            return
        disconnected: list[WebSocket] = []
        for websocket in self.websockets:
            try:
                await websocket.send_json(payload)
            except Exception:
                disconnected.append(websocket)
        for websocket in disconnected:
            self.websockets.discard(websocket)
        self.manager.set_client_count(len(self.websockets))

    async def _send_json(self, websocket: WebSocket, payload: dict[str, object]) -> None:
        await websocket.send_json(payload)

    async def _send_snapshot(self, websocket: WebSocket) -> None:
        await self._send_json(websocket, {"type": "state_snapshot", "state": self.manager.snapshot()})
