from __future__ import annotations

from backend.classifiers.base import ClassificationResult, GestureClassifier
from backend.cv.features import FeatureBundle, confidences_from_label


class HeuristicGestureClassifier(GestureClassifier):
    name = "heuristic"

    def predict(self, features: FeatureBundle) -> ClassificationResult:
        openness = features.openness
        angles = features.angles
        open_core = [openness["index"], openness["middle"], openness["ring"], openness["pinky"]]
        avg_open = sum(open_core) / len(open_core)

        is_rock = (
            openness["index"] < 0.4
            and openness["middle"] < 0.55
            and openness["ring"] < 0.7
            and openness["pinky"] < 0.65
            and avg_open < 0.55
        )
        is_paper = (
            openness["index"] > 0.78
            and openness["middle"] > 0.78
            and openness["ring"] > 0.78
            and openness["pinky"] > 0.78
        )
        is_scissors = (
            openness["index"] > 0.72
            and openness["middle"] > 0.72
            and openness["ring"] < 0.62
            and openness["pinky"] < 0.62
            and angles["ring_pip"] < 2.4
            and angles["pinky_pip"] < 2.3
        )

        if is_rock:
            confidence = max(0.55, 1.0 - avg_open)
            return ClassificationResult(
                label="rock",
                confidences=confidences_from_label("rock", confidence),
                confidence=confidence,
                stable_candidate=True,
            )
        if is_paper:
            confidence = max(0.6, min(avg_open, 0.98))
            return ClassificationResult(
                label="paper",
                confidences=confidences_from_label("paper", confidence),
                confidence=confidence,
                stable_candidate=True,
            )
        if is_scissors:
            confidence = min((openness["index"] + openness["middle"]) / 2.0, 0.95)
            return ClassificationResult(
                label="scissors",
                confidences=confidences_from_label("scissors", confidence),
                confidence=confidence,
                stable_candidate=True,
            )

        confidence = max(open_core)
        return ClassificationResult(
            label="unknown",
            confidences=confidences_from_label("rock", 1.0 / 3.0),
            confidence=confidence,
            stable_candidate=False,
        )
