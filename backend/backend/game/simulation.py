from __future__ import annotations

from dataclasses import dataclass

from backend.game.state import Move


@dataclass(slots=True)
class SimulationPrediction:
    move: Move
    confidences: dict[str, float]


SIMULATION_PREDICTIONS: list[SimulationPrediction] = [
    SimulationPrediction("rock", {"rock": 0.62, "paper": 0.2, "scissors": 0.18}),
    SimulationPrediction("rock", {"rock": 0.72, "paper": 0.18, "scissors": 0.10}),
    SimulationPrediction("scissors", {"rock": 0.18, "paper": 0.17, "scissors": 0.65}),
    SimulationPrediction("paper", {"rock": 0.1, "paper": 0.78, "scissors": 0.12}),
    SimulationPrediction("paper", {"rock": 0.08, "paper": 0.85, "scissors": 0.07}),
]
