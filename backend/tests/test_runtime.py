import asyncio

from backend.app.runtime import AppRuntime


class StubHandTracker:
    available = False
    reason = "stubbed for tests"

    def close(self) -> None:
        pass


def test_auto_complete_round_randomizes_computer_move_and_resets(monkeypatch) -> None:
    monkeypatch.setattr("backend.app.runtime.HandTracker", StubHandTracker)
    monkeypatch.setattr("backend.app.runtime.random.choice", lambda moves: "paper")

    runtime = AppRuntime(
        auto_reveal_delay=0,
        auto_result_delay=0,
        auto_reset_delay=0,
    )
    runtime.manager.set_mode("simulate")
    runtime.manager.set_hand_detected(True)
    runtime.manager.apply_prediction(
        move="rock",
        confidences={"rock": 0.9, "paper": 0.05, "scissors": 0.05},
        stable=True,
        source="simulation",
    )
    runtime.manager.start_countdown()
    assert runtime.manager.lock_current_move() == "rock"

    asyncio.run(runtime._auto_complete_round())

    snapshot = runtime.manager.snapshot()
    assert snapshot["phase"] == "idle"
    assert snapshot["result"] is None
    assert snapshot["computerMove"] is None
    assert snapshot["lockedPlayerMove"] is None
    assert snapshot["score"] == {"player": 0, "computer": 1}


def test_auto_start_triggers_after_two_seconds_of_same_stable_move(monkeypatch) -> None:
    monkeypatch.setattr("backend.app.runtime.HandTracker", StubHandTracker)

    runtime = AppRuntime(auto_start_hold_seconds=2.0)
    runtime.manager.set_mode("live_cv")
    runtime.manager.set_hand_detected(True)
    runtime.manager.apply_prediction(
        move="scissors",
        confidences={"rock": 0.05, "paper": 0.05, "scissors": 0.9},
        stable=True,
        source="live_cv",
    )

    assert runtime._update_auto_start_tracking(10.0) is False
    assert runtime._update_auto_start_tracking(11.9) is False
    assert runtime._update_auto_start_tracking(12.0) is True
    assert runtime._update_auto_start_tracking(12.1) is False
