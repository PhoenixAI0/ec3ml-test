import numpy as np

from backend.classifiers.heuristic import HeuristicGestureClassifier
from backend.cv.features import extract_feature_bundle


def _make_landmarks(openness: dict[str, float]) -> np.ndarray:
    landmarks = np.zeros((21, 3), dtype=np.float32)
    landmarks[5] = [0.2, 0.0, 0.0]
    landmarks[9] = [0.0, -0.1, 0.0]
    landmarks[13] = [-0.2, 0.0, 0.0]
    landmarks[17] = [-0.35, 0.15, 0.0]

    open_positions = {
        "thumb": ([0.05, -0.02, 0.0], [0.18, -0.03, 0.0], [0.28, -0.04, 0.0], [0.38, -0.05, 0.0]),
        "index": ([0.14, -0.05, 0.0], [0.16, -0.18, 0.0], [0.17, -0.30, 0.0], [0.18, -0.44, 0.0]),
        "middle": ([0.02, -0.08, 0.0], [0.02, -0.24, 0.0], [0.02, -0.38, 0.0], [0.02, -0.55, 0.0]),
        "ring": ([-0.12, -0.04, 0.0], [-0.14, -0.17, 0.0], [-0.15, -0.28, 0.0], [-0.16, -0.40, 0.0]),
        "pinky": ([-0.25, 0.02, 0.0], [-0.29, -0.08, 0.0], [-0.31, -0.17, 0.0], [-0.34, -0.27, 0.0]),
    }
    closed_positions = {
        "thumb": ([0.05, -0.02, 0.0], [0.10, 0.02, 0.0], [0.12, 0.08, 0.0], [0.10, 0.12, 0.0]),
        "index": ([0.14, -0.05, 0.0], [0.18, -0.02, 0.0], [0.16, 0.06, 0.0], [0.10, 0.08, 0.0]),
        "middle": ([0.02, -0.08, 0.0], [0.05, -0.01, 0.0], [0.03, 0.08, 0.0], [-0.04, 0.10, 0.0]),
        "ring": ([-0.12, -0.04, 0.0], [-0.11, 0.02, 0.0], [-0.13, 0.08, 0.0], [-0.19, 0.10, 0.0]),
        "pinky": ([-0.25, 0.02, 0.0], [-0.23, 0.08, 0.0], [-0.26, 0.13, 0.0], [-0.32, 0.15, 0.0]),
    }
    index_map = {
        "thumb": (1, 2, 3, 4),
        "index": (5, 6, 7, 8),
        "middle": (9, 10, 11, 12),
        "ring": (13, 14, 15, 16),
        "pinky": (17, 18, 19, 20),
    }

    for finger, indices in index_map.items():
        target = openness[finger]
        finger_open = open_positions[finger]
        finger_closed = closed_positions[finger]
        for point_index, open_coords, closed_coords in zip(
            indices, finger_open, finger_closed, strict=True
        ):
            open_point = np.array(open_coords, dtype=np.float32)
            closed_point = np.array(closed_coords, dtype=np.float32)
            landmarks[point_index] = closed_point + (open_point - closed_point) * target

    return landmarks


def test_classifies_rock() -> None:
    classifier = HeuristicGestureClassifier()
    bundle = extract_feature_bundle(
        _make_landmarks(
            {"thumb": 0.3, "index": 0.1, "middle": 0.1, "ring": 0.1, "pinky": 0.1}
        )
    )
    result = classifier.predict(bundle)
    assert result.label == "rock"


def test_classifies_paper() -> None:
    classifier = HeuristicGestureClassifier()
    bundle = extract_feature_bundle(
        _make_landmarks(
            {"thumb": 0.8, "index": 1.0, "middle": 1.0, "ring": 0.95, "pinky": 0.9}
        )
    )
    result = classifier.predict(bundle)
    assert result.label == "paper"


def test_classifies_scissors() -> None:
    classifier = HeuristicGestureClassifier()
    bundle = extract_feature_bundle(
        _make_landmarks(
            {"thumb": 0.4, "index": 1.0, "middle": 1.0, "ring": 0.15, "pinky": 0.15}
        )
    )
    result = classifier.predict(bundle)
    assert result.label == "scissors"
