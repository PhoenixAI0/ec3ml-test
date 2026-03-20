from __future__ import annotations

import argparse
import csv
from pathlib import Path

import cv2

from backend.cv.features import extract_feature_bundle
from backend.cv.hand_tracker import HandTracker

LABEL_KEYS = {
    ord("1"): "rock",
    ord("2"): "paper",
    ord("3"): "scissors",
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Collect labeled hand gesture features.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("backend/data/gesture_samples.csv"),
        help="CSV file to append captured samples to.",
    )
    parser.add_argument("--camera-index", type=int, default=0)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)

    tracker = HandTracker()
    camera = cv2.VideoCapture(args.camera_index)
    if not camera.isOpened():
        raise SystemExit("Unable to open webcam")

    current_label = "rock"
    header_written = args.output.exists()

    with args.output.open("a", newline="") as handle:
        writer = csv.writer(handle)
        while True:
            ok, frame = camera.read()
            if not ok:
                continue

            observation = tracker.detect(frame)
            prompt = f"label={current_label} | 1=rock 2=paper 3=scissors | space=capture | q=quit"
            cv2.putText(frame, prompt, (12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

            if observation is not None:
                cv2.putText(frame, "hand detected", (12, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                bundle = extract_feature_bundle(observation.landmarks, observation.handedness)
            else:
                bundle = None
                cv2.putText(frame, "no hand", (12, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 100, 255), 2)

            cv2.imshow("RPS Data Collection", frame)
            key = cv2.waitKey(1) & 0xFF

            if key in LABEL_KEYS:
                current_label = LABEL_KEYS[key]
                continue
            if key == ord("q"):
                break
            if key == ord(" ") and bundle is not None:
                row = [current_label, *bundle.feature_vector.tolist()]
                if not header_written:
                    writer.writerow(["label", *[f"f_{index}" for index in range(len(bundle.feature_vector))]])
                    header_written = True
                writer.writerow(row)
                handle.flush()

    tracker.close()
    camera.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
