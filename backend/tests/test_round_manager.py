from backend.game.state import RoundManager


def test_lock_and_score_round() -> None:
    manager = RoundManager()
    manager.set_mode("simulate")
    manager.set_hand_detected(True)
    manager.apply_prediction(
        move="rock",
        confidences={"rock": 0.9, "paper": 0.05, "scissors": 0.05},
        stable=True,
        source="simulation",
    )
    manager.start_countdown()

    locked = manager.lock_current_move()
    assert locked == "rock"

    manager.set_computer_move("scissors")
    result = manager.trigger_result()
    assert result is not None
    assert result["outcome"] == "player"
    assert manager.state.score["player"] == 1


def test_countdown_keeps_initial_locked_move() -> None:
    manager = RoundManager()
    manager.set_mode("simulate")
    manager.set_hand_detected(True)
    manager.apply_prediction(
        move="rock",
        confidences={"rock": 0.9, "paper": 0.05, "scissors": 0.05},
        stable=True,
        source="simulation",
    )

    locked = manager.start_countdown()
    assert locked == "rock"
    assert manager.snapshot()["lockedPlayerMove"] == "rock"

    manager.apply_prediction(
        move="paper",
        confidences={"rock": 0.05, "paper": 0.9, "scissors": 0.05},
        stable=True,
        source="simulation",
    )

    locked = manager.lock_current_move()
    assert locked == "rock"
    assert manager.snapshot()["playerMove"] == "rock"


def test_override_survives_live_prediction() -> None:
    manager = RoundManager()
    manager.set_mode("live_cv")
    manager.set_prediction_override(
        "paper",
        {"rock": 0.05, "paper": 0.9, "scissors": 0.05},
    )
    snapshot = manager.snapshot()
    assert snapshot["predictedMove"] == "paper"
    assert snapshot["overrideActive"] is True

    manager.apply_prediction(
        move="rock",
        confidences={"rock": 0.8, "paper": 0.1, "scissors": 0.1},
        stable=True,
        source="live_cv",
    )
    snapshot = manager.snapshot()
    assert snapshot["predictedMove"] == "paper"


def test_snapshot_exposes_predicted_move_before_lock() -> None:
    manager = RoundManager()
    manager.set_mode("simulate")
    manager.set_hand_detected(True)
    manager.apply_prediction(
        move="paper",
        confidences={"rock": 0.05, "paper": 0.9, "scissors": 0.05},
        stable=False,
        source="simulation",
    )

    snapshot = manager.snapshot()
    assert snapshot["playerMove"] == "paper"
    assert snapshot["lockedPlayerMove"] is None
    assert snapshot["predictionStable"] is False


def test_unknown_override_cannot_lock() -> None:
    manager = RoundManager()
    manager.set_prediction_override(
        "unknown",
        {"rock": 0.34, "paper": 0.33, "scissors": 0.33},
    )

    assert manager.can_lock() is False
    assert manager.lock_current_move() is None


def test_countdown_fails_without_stable_move() -> None:
    manager = RoundManager()
    manager.set_mode("live_cv")
    manager.set_hand_detected(True)
    manager.apply_prediction(
        move="unknown",
        confidences={"rock": 0.34, "paper": 0.33, "scissors": 0.33},
        stable=False,
        source="live_cv",
    )
    started = manager.start_countdown()
    assert started is None
    locked = manager.lock_current_move()
    assert locked is None
