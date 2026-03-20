from __future__ import annotations

from dataclasses import dataclass

from backend.cv.features import FeatureBundle


@dataclass(slots=True)
class ClassificationResult:
    label: str
    confidences: dict[str, float]
    confidence: float
    stable_candidate: bool


class GestureClassifier:
    name = "base"

    def predict(self, features: FeatureBundle) -> ClassificationResult:
        raise NotImplementedError
