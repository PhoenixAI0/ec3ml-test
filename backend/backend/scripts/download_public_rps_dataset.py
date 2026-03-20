from __future__ import annotations

import argparse
import shutil
import zipfile
from pathlib import Path
from urllib.request import urlopen

DATASET_URLS = {
    "train": "https://storage.googleapis.com/download.tensorflow.org/data/rps.zip",
    "test": "https://storage.googleapis.com/download.tensorflow.org/data/rps-test-set.zip",
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Download the public rock-paper-scissors dataset.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("backend/data/public/rps"),
        help="Directory where the public dataset will be downloaded and extracted.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-download and re-extract even if the dataset already exists.",
    )
    return parser


def download_file(url: str, destination: Path) -> None:
    with urlopen(url) as response, destination.open("wb") as handle:
        shutil.copyfileobj(response, handle)


def main() -> None:
    args = build_parser().parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for split, url in DATASET_URLS.items():
        archive_path = args.output_dir / f"{split}.zip"
        extract_dir = args.output_dir / split
        sentinel = extract_dir / ".complete"

        if sentinel.exists() and not args.force:
            print(f"{split}: already present at {extract_dir}")
            continue

        if extract_dir.exists() and args.force:
            shutil.rmtree(extract_dir)
        extract_dir.mkdir(parents=True, exist_ok=True)

        print(f"Downloading {split} dataset from {url}")
        download_file(url, archive_path)

        print(f"Extracting {archive_path} -> {extract_dir}")
        with zipfile.ZipFile(archive_path) as zf:
            zf.extractall(extract_dir)
        sentinel.write_text("ok\n")

    print(f"Public RPS dataset ready at {args.output_dir}")


if __name__ == "__main__":
    main()
