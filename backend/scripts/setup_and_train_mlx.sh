#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
DEFAULT_DATA="$BACKEND_DIR/data/gesture_samples.csv"
PUBLIC_DATA="$BACKEND_DIR/data/gesture_samples_public.csv"

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "This script targets Apple silicon macOS with MLX." >&2
  exit 1
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "uv is required but not installed." >&2
  exit 1
fi

export MPLCONFIGDIR="$BACKEND_DIR/.mplconfig"
export XDG_CACHE_HOME="$BACKEND_DIR/.cache"
mkdir -p "$MPLCONFIGDIR" "$XDG_CACHE_HOME"

DATA_PATH="${DATA_PATH:-$DEFAULT_DATA}"
ARGS=("$@")
for ((i = 0; i < ${#ARGS[@]}; i++)); do
  if [[ "${ARGS[$i]}" == "--data" && $((i + 1)) -lt ${#ARGS[@]} ]]; then
    DATA_PATH="${ARGS[$((i + 1))]}"
  fi
done

if [[ ! -f "$DATA_PATH" ]]; then
  if [[ "$DATA_PATH" == "$DEFAULT_DATA" ]]; then
    echo "Local training CSV not found at $DATA_PATH"
    echo "Bootstrapping from the public TensorFlow rock-paper-scissors dataset instead..."
    DATA_PATH="$PUBLIC_DATA"
  else
    echo "Training data not found at $DATA_PATH" >&2
    echo "Collect samples first with:" >&2
    echo "  uv run --project backend python -m backend.scripts.collect_data" >&2
    exit 1
  fi
fi

echo "Syncing backend dependencies with MLX support..."
uv sync --project "$BACKEND_DIR"

if [[ ! -f "$BACKEND_DIR/models/hand_landmarker.task" ]]; then
  echo "Downloading MediaPipe hand-landmarker model..."
  uv run --project "$BACKEND_DIR" python -m backend.scripts.download_models
fi

if [[ "$DATA_PATH" == "$PUBLIC_DATA" && ! -f "$DATA_PATH" ]]; then
  echo "Downloading public rock-paper-scissors datasets..."
  uv run --project "$BACKEND_DIR" python -m backend.scripts.download_public_rps_dataset
  echo "Extracting landmark features from public datasets..."
  uv run --project "$BACKEND_DIR" python -m backend.scripts.prepare_public_rps_features --output "$DATA_PATH"
fi

echo "Starting MLX training with dataset: $DATA_PATH"
if (( ${#ARGS[@]} )); then
  exec uv run --project "$BACKEND_DIR" python -m backend.scripts.train_model \
    --backend mlx \
    --data "$DATA_PATH" \
    "${ARGS[@]}"
else
  exec uv run --project "$BACKEND_DIR" python -m backend.scripts.train_model \
    --backend mlx \
    --data "$DATA_PATH"
fi
