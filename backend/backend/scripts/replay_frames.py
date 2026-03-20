from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np

from backend.classifiers.heuristic import HeuristicGestureClassifier
from backend.cv.features import extract_feature_bundle
from backend.cv.hand_tracker import HandTracker


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Replay saved frames through the heuristic pipeline.")
    parser.add_argument("frames", nargs="+", type=Path)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    tracker = HandTracker()
    classifier = HeuristicGestureClassifier()

    for frame_path in args.frames:
        encoded = np.frombuffer(frame_path.read_bytes(), dtype=np.uint8)
        frame = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
        observation = tracker.detect(frame)
        if observation is None:
            print(f"{frame_path.name}: no hand")
            continue

        bundle = extract_feature_bundle(observation.landmarks, observation.handedness)
        result = classifier.predict(bundle)
        print(f"{frame_path.name}: {result.label} ({result.confidence:.2f}) {result.confidences}")

    tracker.close()


if __name__ == "__main__":
    main()
