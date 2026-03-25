from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


Move = Literal["rock", "paper", "scissors"]
PredictedMove = Move | Literal["unknown"]
DemoPhase = Literal[
    "idle",
    "waiting_for_hand",
    "hand_detected",
    "predicting",
    "countdown",
    "locked",
    "reveal",
    "result",
]
RuntimeMode = Literal["simulate", "live_cv"]
PredictionSource = Literal["simulation", "live_cv", "presenter"]
ClassifierKind = Literal["heuristic", "learned"]
ClassifierPreference = Literal["auto", "heuristic", "learned"]
VALID_MOVES = frozenset({"rock", "paper", "scissors"})


def empty_confidences() -> dict[str, float]:
    return {"rock": 0.0, "paper": 0.0, "scissors": 0.0}


def as_move(value: PredictedMove | None) -> Move | None:
    return value if value in VALID_MOVES else None


def determine_outcome(player: Move, computer: Move) -> str:
    if player == computer:
        return "draw"
    if (
        (player == "rock" and computer == "scissors")
        or (player == "paper" and computer == "rock")
        or (player == "scissors" and computer == "paper")
    ):
        return "player"
    return "computer"


@dataclass(slots=True)
class ClassifierStatusState:
    requested: ClassifierPreference = "auto"
    active: ClassifierKind = "heuristic"
    model_loaded: bool = False
    fallback_reason: str | None = "Learned model not loaded"

    def to_dict(self) -> dict[str, object]:
        return {
            "requested": self.requested,
            "active": self.active,
            "modelLoaded": self.model_loaded,
            "fallbackReason": self.fallback_reason,
        }


@dataclass(slots=True)
class HealthStatusState:
    mode: RuntimeMode = "simulate"
    active_classifier: ClassifierKind = "heuristic"
    hand_detected: bool = False
    prediction: PredictedMove | None = None
    stable: bool = False
    recent_confidence: float = 0.0
    frame_age_ms: int | None = None
    clients: int = 0
    message: str | None = None

    def to_dict(self) -> dict[str, object]:
        return {
            "mode": self.mode,
            "activeClassifier": self.active_classifier,
            "handDetected": self.hand_detected,
            "prediction": self.prediction,
            "stable": self.stable,
            "recentConfidence": self.recent_confidence,
            "frameAgeMs": self.frame_age_ms,
            "clients": self.clients,
            "message": self.message,
        }


@dataclass(slots=True)
class GameState:
    mode: RuntimeMode = "simulate"
    phase: DemoPhase = "idle"
    hand_detected: bool = False
    predicted_move: PredictedMove | None = None
    prediction_stable: bool = False
    prediction_source: PredictionSource = "simulation"
    locked_player_move: Move | None = None
    computer_move: Move | None = None
    confidences: dict[str, float] = field(default_factory=empty_confidences)
    countdown_value: int = 3
    result: dict[str, object] | None = None
    score: dict[str, int] = field(default_factory=lambda: {"player": 0, "computer": 0})
    override_active: bool = False
    override_move: PredictedMove | None = None
    override_confidences: dict[str, float] = field(default_factory=empty_confidences)
    classifier_status: ClassifierStatusState = field(default_factory=ClassifierStatusState)
    health: HealthStatusState = field(default_factory=HealthStatusState)

    def effective_move(self) -> PredictedMove | None:
        return self.override_move if self.override_active else self.predicted_move

    def effective_confidences(self) -> dict[str, float]:
        return self.override_confidences if self.override_active else self.confidences

    def snapshot_prediction_stable(self) -> bool:
        return self.effective_move() != "unknown" if self.override_active else self.prediction_stable

    def current_player_move(self) -> Move | None:
        return self.locked_player_move or as_move(self.effective_move())

    def lockable_move(self) -> Move | None:
        effective_move = as_move(self.effective_move())
        if effective_move is None:
            return None
        return effective_move if self.override_active or self.prediction_stable else None

    def snapshot(self) -> dict[str, object]:
        predicted_move = self.effective_move()
        confidences = self.effective_confidences()

        return {
            "mode": self.mode,
            "phase": self.phase,
            "handDetected": self.hand_detected,
            "predictedMove": predicted_move,
            "predictionStable": self.snapshot_prediction_stable(),
            "predictionSource": "presenter" if self.override_active else self.prediction_source,
            "playerMove": self.current_player_move(),
            "lockedPlayerMove": self.locked_player_move,
            "computerMove": self.computer_move,
            "confidences": confidences,
            "countdownValue": self.countdown_value,
            "result": self.result,
            "score": self.score,
            "overrideActive": self.override_active,
            "classifierStatus": self.classifier_status.to_dict(),
            "health": self.health.to_dict(),
        }


class RoundManager:
    def __init__(self) -> None:
        self.state = GameState()

    def snapshot(self) -> dict[str, object]:
        return self.state.snapshot()

    def set_client_count(self, count: int) -> None:
        self.state.health.clients = count

    def set_mode(self, mode: RuntimeMode) -> None:
        self.state.mode = mode
        self.state.health.mode = mode
        self.reset_round(preserve_score=True, clear_override=False)
        self.state.phase = "idle" if mode == "simulate" else "waiting_for_hand"
        self.state.health.message = None

    def set_classifier_status(
        self,
        *,
        requested: ClassifierPreference,
        active: ClassifierKind,
        model_loaded: bool,
        fallback_reason: str | None,
    ) -> None:
        self.state.classifier_status = ClassifierStatusState(
            requested=requested,
            active=active,
            model_loaded=model_loaded,
            fallback_reason=fallback_reason,
        )
        self.state.health.active_classifier = active

    def update_health(
        self,
        *,
        frame_age_ms: int | None = None,
        message: str | None = None,
    ) -> None:
        if frame_age_ms is not None:
            self.state.health.frame_age_ms = frame_age_ms
        self.state.health.hand_detected = self.state.hand_detected
        effective_move = self.state.effective_move()
        confidence = max(self.state.effective_confidences().values(), default=0.0)
        self.state.health.prediction = effective_move
        self.state.health.stable = (
            effective_move in VALID_MOVES and self.state.prediction_stable
        ) or self.state.override_active
        self.state.health.recent_confidence = float(confidence)
        if message is not None:
            self.state.health.message = message

    def set_hand_detected(self, detected: bool) -> None:
        self.state.hand_detected = detected
        if self.state.mode != "live_cv":
            return
        if self.state.phase in {"countdown", "locked", "reveal", "result"}:
            return
        if not detected:
            self.state.phase = "waiting_for_hand"
        elif self.state.predicted_move:
            self.state.phase = "predicting"
        else:
            self.state.phase = "hand_detected"

    def apply_prediction(
        self,
        *,
        move: PredictedMove,
        confidences: dict[str, float],
        stable: bool,
        source: PredictionSource,
    ) -> None:
        if self.state.phase in {"locked", "reveal", "result"} and source != "presenter":
            return

        self.state.predicted_move = move
        self.state.prediction_stable = stable
        self.state.prediction_source = source
        self.state.confidences = confidences

        if self.state.mode == "live_cv" and self.state.phase not in {"countdown", "locked", "reveal", "result"}:
            if not self.state.hand_detected:
                self.state.phase = "waiting_for_hand"
            elif move == "unknown":
                self.state.phase = "hand_detected"
            else:
                self.state.phase = "predicting"

        self.update_health()

    def set_prediction_override(
        self, move: PredictedMove, confidences: dict[str, float]
    ) -> None:
        self.state.override_active = True
        self.state.override_move = move
        self.state.override_confidences = confidences
        self.update_health(message="Presenter override active")

    def clear_prediction_override(self) -> None:
        self.state.override_active = False
        self.state.override_move = None
        self.state.override_confidences = empty_confidences()
        self.update_health(message=None)

    def start_countdown(self) -> Move | None:
        locked_move = self.state.locked_player_move or self.state.lockable_move()
        if locked_move is None:
            return None
        self.state.locked_player_move = locked_move
        self.state.phase = "countdown"
        self.state.countdown_value = 3
        return locked_move

    def set_countdown_value(self, value: int) -> None:
        self.state.countdown_value = value

    def can_lock(self) -> bool:
        return self.state.lockable_move() is not None

    def lock_current_move(self) -> Move | None:
        locked_move = self.state.locked_player_move or self.state.lockable_move()
        if locked_move is None:
            return None
        self.state.locked_player_move = locked_move
        self.state.phase = "locked"
        return self.state.locked_player_move

    def set_computer_move(self, move: Move) -> None:
        self.state.computer_move = move

    def trigger_reveal(self) -> None:
        self.state.phase = "reveal"

    def trigger_result(self) -> dict[str, object] | None:
        if not self.state.locked_player_move or not self.state.computer_move:
            return None
        outcome = determine_outcome(self.state.locked_player_move, self.state.computer_move)
        result = {
            "playerMove": self.state.locked_player_move,
            "computerMove": self.state.computer_move,
            "outcome": outcome,
        }
        self.state.result = result
        self.state.phase = "result"
        if outcome == "player":
            self.state.score["player"] += 1
        elif outcome == "computer":
            self.state.score["computer"] += 1
        return result

    def reset_round(self, *, preserve_score: bool = True, clear_override: bool = True) -> None:
        score = dict(self.state.score)
        mode = self.state.mode
        classifier_status = self.state.classifier_status
        health = self.state.health
        override_active = self.state.override_active
        override_move = self.state.override_move
        override_confidences = dict(self.state.override_confidences)
        self.state = GameState(
            mode=mode,
            phase="idle" if mode == "simulate" else "waiting_for_hand",
            score=score if preserve_score else {"player": 0, "computer": 0},
            classifier_status=classifier_status,
            health=health,
        )
        if not clear_override:
            self.state.override_active = override_active
            self.state.override_move = override_move
            self.state.override_confidences = override_confidences
        self.update_health(message=None)
