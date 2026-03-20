from __future__ import annotations

from dataclasses import dataclass
from math import acos
from typing import Iterable

import numpy as np

FINGER_CHAINS = {
    "thumb": (1, 2, 3, 4),
    "index": (5, 6, 7, 8),
    "middle": (9, 10, 11, 12),
    "ring": (13, 14, 15, 16),
    "pinky": (17, 18, 19, 20),
}


@dataclass(slots=True)
class FeatureBundle:
    landmarks: np.ndarray
    handedness: str | None
    normalized_landmarks: np.ndarray
    openness: dict[str, float]
    angles: dict[str, float]
    pairwise_distances: dict[str, float]
    feature_vector: np.ndarray


def _safe_norm(vector: np.ndarray) -> float:
    return float(np.linalg.norm(vector) + 1e-8)


def _angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    ab = a - b
    cb = c - b
    denom = _safe_norm(ab) * _safe_norm(cb)
    cosine = np.clip(float(np.dot(ab, cb) / denom), -1.0, 1.0)
    return acos(cosine)


def _normalize_landmarks(landmarks: np.ndarray) -> np.ndarray:
    wrist = landmarks[0]
    centered = landmarks - wrist
    index_mcp = centered[5]
    pinky_mcp = centered[17]
    palm_width = _safe_norm(index_mcp - pinky_mcp)
    middle_mcp = centered[9]
    palm_height = _safe_norm(middle_mcp)
    scale = max(palm_width, palm_height, 1e-6)
    return centered / scale


def _finger_openness(landmarks: np.ndarray, finger: str) -> float:
    a, b, c, d = FINGER_CHAINS[finger]
    chain_length = _safe_norm(landmarks[b] - landmarks[a]) + _safe_norm(
        landmarks[c] - landmarks[b]
    ) + _safe_norm(landmarks[d] - landmarks[c])
    straight_distance = _safe_norm(landmarks[d] - landmarks[a])
    raw = straight_distance / max(chain_length, 1e-6)
    return float(np.clip((raw - 0.45) / 0.55, 0.0, 1.0))


def _pairwise_distances(landmarks: np.ndarray) -> dict[str, float]:
    pairs = {
        "thumb_index_tip": (4, 8),
        "index_middle_tip": (8, 12),
        "middle_ring_tip": (12, 16),
        "ring_pinky_tip": (16, 20),
        "index_pinky_tip": (8, 20),
    }
    return {
        name: float(_safe_norm(landmarks[i] - landmarks[j])) for name, (i, j) in pairs.items()
    }


def extract_feature_bundle(
    landmarks: np.ndarray, handedness: str | None = None
) -> FeatureBundle:
    if landmarks.shape != (21, 3):
        raise ValueError("Expected landmarks with shape (21, 3)")

    normalized = _normalize_landmarks(landmarks)
    openness = {finger: _finger_openness(normalized, finger) for finger in FINGER_CHAINS}
    angles = {
        "thumb_ip": _angle(normalized[2], normalized[3], normalized[4]),
        "index_pip": _angle(normalized[5], normalized[6], normalized[8]),
        "middle_pip": _angle(normalized[9], normalized[10], normalized[12]),
        "ring_pip": _angle(normalized[13], normalized[14], normalized[16]),
        "pinky_pip": _angle(normalized[17], normalized[18], normalized[20]),
    }
    distances = _pairwise_distances(normalized)
    hand_flag = 0.0 if handedness == "Left" else 1.0 if handedness == "Right" else 0.5

    feature_vector = np.concatenate(
        [
            normalized.reshape(-1),
            np.array(list(openness.values()), dtype=np.float32),
            np.array(list(angles.values()), dtype=np.float32),
            np.array(list(distances.values()), dtype=np.float32),
            np.array([hand_flag], dtype=np.float32),
        ]
    ).astype(np.float32)

    return FeatureBundle(
        landmarks=landmarks.astype(np.float32),
        handedness=handedness,
        normalized_landmarks=normalized.astype(np.float32),
        openness=openness,
        angles=angles,
        pairwise_distances=distances,
        feature_vector=feature_vector,
    )


def confidences_from_label(label: str, strength: float) -> dict[str, float]:
    bounded = float(np.clip(strength, 0.0, 1.0))
    base = max((1.0 - bounded) / 2.0, 0.0)
    confidences = {"rock": base, "paper": base, "scissors": base}
    if label in confidences:
        confidences[label] = bounded
    return confidences


def feature_rows_to_matrix(rows: Iterable[dict[str, float]]) -> tuple[list[str], np.ndarray]:
    records = list(rows)
    if not records:
        raise ValueError("No feature rows provided")

    labels = [str(record["label"]) for record in records]
    matrix = np.array(
        [[float(record[f"f_{index}"]) for index in range(len(records[0]) - 1)] for record in records],
        dtype=np.float32,
    )
    return labels, matrix
