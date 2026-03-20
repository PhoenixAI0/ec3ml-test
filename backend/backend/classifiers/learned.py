from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np

from backend.classifiers.base import ClassificationResult, GestureClassifier
from backend.classifiers.mlx_model import load_mlx_model, predict_mlx_probabilities
from backend.cv.features import FeatureBundle


@dataclass(slots=True)
class LoadedModel:
    model: object
    metadata: dict[str, object]
    model_type: str
    artifact_path: Path


class LearnedLandmarkClassifier(GestureClassifier):
    name = "learned"

    def __init__(self, model: object, metadata: dict[str, object]) -> None:
        self.model = model
        self.metadata = metadata
        self.model_type = str(metadata.get("model_type", "sklearn_random_forest"))
        self.class_names = [str(label) for label in metadata.get("labels", ["rock", "paper", "scissors"])]
        self.feature_mean = np.array(
            metadata.get("feature_mean", [0.0] * int(metadata.get("input_dim", 0))),
            dtype=np.float32,
        )
        self.feature_std = np.array(
            metadata.get("feature_std", [1.0] * int(metadata.get("input_dim", 0))),
            dtype=np.float32,
        )

    @classmethod
    def load(cls, model_path: Path, metadata_path: Path) -> "LearnedLandmarkClassifier":
        metadata = json.loads(metadata_path.read_text())
        model_type = str(metadata.get("model_type", "sklearn_random_forest"))
        if model_type == "mlx_mlp":
            model = load_mlx_model(
                model_path,
                input_dim=int(metadata["input_dim"]),
                hidden_dims=[int(value) for value in metadata.get("hidden_dims", [])],
                output_dim=len(metadata.get("labels", ["rock", "paper", "scissors"])),
            )
        else:
            model = joblib.load(model_path)
        return cls(model=model, metadata=metadata)

    def predict(self, features: FeatureBundle) -> ClassificationResult:
        if self.model_type == "mlx_mlp":
            probabilities = predict_mlx_probabilities(
                self.model,
                features.feature_vector.reshape(1, -1),
                feature_mean=self.feature_mean,
                feature_std=self.feature_std,
            )[0]
        else:
            probabilities = self.model.predict_proba(features.feature_vector.reshape(1, -1))[0]
        confidences = {
            label: float(probabilities[index]) for index, label in enumerate(self.class_names)
        }
        top_label = max(confidences, key=confidences.get)
        confidence = float(confidences[top_label])
        label = top_label if confidence >= 0.45 else "unknown"
        return ClassificationResult(
            label=label,
            confidences=confidences,
            confidence=confidence,
            stable_candidate=label != "unknown" and confidence >= 0.55,
        )


def load_validated_model(
    model_path: Path, metadata_path: Path, expected_feature_version: int
) -> LoadedModel | None:
    if not metadata_path.exists():
        return None

    metadata = json.loads(metadata_path.read_text())
    if int(metadata.get("feature_version", -1)) != expected_feature_version:
        return None
    if not bool(metadata.get("runtime_safe", False)):
        return None

    model_type = str(metadata.get("model_type", "sklearn_random_forest"))
    artifact_filename = str(metadata.get("artifact_filename", model_path.name))
    artifact_path = metadata_path.with_name(artifact_filename)
    if not artifact_path.exists():
        return None

    try:
        if model_type == "mlx_mlp":
            model = load_mlx_model(
                artifact_path,
                input_dim=int(metadata["input_dim"]),
                hidden_dims=[int(value) for value in metadata.get("hidden_dims", [])],
                output_dim=len(metadata.get("labels", ["rock", "paper", "scissors"])),
            )
        else:
            model = joblib.load(artifact_path)
    except Exception:
        return None

    return LoadedModel(
        model=model,
        metadata=metadata,
        model_type=model_type,
        artifact_path=artifact_path,
    )
