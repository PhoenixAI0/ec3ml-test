from __future__ import annotations

import argparse
from pathlib import Path
from urllib.request import urlretrieve

HAND_LANDMARKER_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Download pretrained MediaPipe model assets.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("backend/models/hand_landmarker.task"),
        help="Destination for the MediaPipe hand landmarker asset.",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {HAND_LANDMARKER_URL}")
    urlretrieve(HAND_LANDMARKER_URL, args.output)
    print(f"Saved to {args.output}")


if __name__ == "__main__":
    main()
