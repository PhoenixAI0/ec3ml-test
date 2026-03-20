from __future__ import annotations

import argparse
import csv
from pathlib import Path

import cv2
import numpy as np

from backend.cv.features import extract_feature_bundle
from backend.cv.hand_tracker import HandTracker

LABELS = ["rock", "paper", "scissors"]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Convert the public image RPS dataset into landmark feature CSV rows."
    )
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=Path("backend/data/public/rps"),
        help="Root created by download_public_rps_dataset.py",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("backend/data/gesture_samples_public.csv"),
        help="CSV output path for extracted landmark features.",
    )
    parser.add_argument(
        "--limit-per-class",
        type=int,
        default=0,
        help="Optional cap per label per split for quick smoke tests. 0 means no limit.",
    )
    return parser


def iter_labeled_images(dataset_dir: Path):
    for split in ("train", "test"):
        split_dir = dataset_dir / split
        candidates = [split_dir / "rps", split_dir / "rps-test-set", split_dir]
        base_dir = next((candidate for candidate in candidates if candidate.exists()), None)
        if base_dir is None:
            continue

        for label in LABELS:
            label_dir = base_dir / label
            if not label_dir.exists():
                continue
            for image_path in sorted(label_dir.glob("*")):
                if image_path.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
                    continue
                yield split, label, image_path


def main() -> None:
    args = build_parser().parse_args()
    tracker = HandTracker()
    if not tracker.available:
        raise SystemExit(f"Hand tracker unavailable: {tracker.reason}")

    rows: list[list[object]] = []
    feature_count = 0
    processed_counts = {(split, label): 0 for split in ("train", "test") for label in LABELS}
    skipped = 0

    try:
        for split, label, image_path in iter_labeled_images(args.dataset_dir):
            if args.limit_per_class and processed_counts[(split, label)] >= args.limit_per_class:
                continue

            frame = cv2.imread(str(image_path))
            if frame is None:
                skipped += 1
                continue

            observation = tracker.detect(frame)
            if observation is None:
                skipped += 1
                continue

            bundle = extract_feature_bundle(observation.landmarks, observation.handedness)
            if feature_count == 0:
                feature_count = len(bundle.feature_vector)

            rows.append(
                [
                    label,
                    split,
                    str(image_path),
                    *bundle.feature_vector.astype(np.float32).tolist(),
                ]
            )
            processed_counts[(split, label)] += 1
    finally:
        tracker.close()

    if not rows:
        raise SystemExit("No features extracted from the public dataset.")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "label",
                "source_split",
                "source_path",
                *[f"f_{index}" for index in range(feature_count)],
            ]
        )
        writer.writerows(rows)

    print(f"Wrote {len(rows)} feature rows to {args.output}")
    for split in ("train", "test"):
        for label in LABELS:
            count = processed_counts[(split, label)]
            if count:
                print(f"{split}/{label}: {count}")
    print(f"Skipped images: {skipped}")


if __name__ == "__main__":
    main()
