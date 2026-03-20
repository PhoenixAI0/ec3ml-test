# RPS Showcase

A presentation-first rock-paper-scissors showcase with a real Python backend for hand tracking and gesture recognition, plus a simulation fallback for demo-day safety.

## Stack

- Frontend: Bun, React, TypeScript, Tailwind, Framer Motion, Zustand
- Backend: FastAPI, WebSockets, OpenCV, NumPy, MediaPipe, scikit-learn
- Tooling: `uv` for Python environment management

## Why this backend design

The backend prioritises reliability and low-latency local inference over architectural cleverness:

- MediaPipe handles the hard part: detecting a hand and extracting landmarks on CPU.
- Gesture classification sits on top of landmarks and is pluggable.
- A heuristic classifier is always available as the demo-safe fallback.
- A learned classifier can be trained locally and loaded when a validated artifact exists.
- Simulation mode remains a first-class mode so the presenter can rescue the demo instantly.

## Repo layout

```text
/app       Bun + React frontend
/backend   Python FastAPI backend, CV pipeline, training scripts, tests
/shared    Shared TypeScript protocol and state types
```

## Quick start

### Prerequisites

- Bun
- `uv`
- Python `3.11` or `3.12`

### Install

```bash
bun install
uv sync --project backend
```

The live CV path expects a local MediaPipe model asset at `backend/models/hand_landmarker.task`.
If it is missing, download it once with:

```bash
uv run --project backend python -m backend.scripts.download_models
```

### Run both services

```bash
bun run dev
```

- Frontend: http://localhost:5173
- Backend websocket: ws://localhost:3001/ws
- Health: http://localhost:3001/health
- Debug snapshot: http://localhost:3001/debug/state

You can also run them separately:

```bash
bun run dev:app
bun run dev:backend
```

## Runtime modes

### `simulate`

- Behaves like the old stub.
- Useful as a guaranteed fallback for presentations.
- Supports autoplay and manual presenter control.

### `live_cv`

- Browser captures webcam frames and streams compressed JPEGs over the websocket.
- Backend decodes only the latest frame, detects landmarks, classifies the gesture, smooths predictions, and drives the round state.
- If frames stop, no hand is visible, or the learned model is unavailable, the backend degrades cleanly instead of crashing.

## Architecture overview

### 1. WebSocket API

- Text frames carry JSON control messages and state updates.
- Binary frames carry JPEG webcam images from the browser.

### 2. Frame ingestion

- Frontend captures frames at `320x240`, target `8 FPS`.
- Backend stores only the latest frame to avoid queue lag.

### 3. CV backbone

- MediaPipe hand tracking extracts one hand worth of landmarks per frame.
- If no hand is visible, the backend reports `waiting_for_hand` or `hand_detected` states instead of pretending a prediction exists.

### 4. Gesture classification

- `HeuristicGestureClassifier`
  - Uses finger openness and joint geometry.
  - Designed as the dependable fallback.
- `LearnedLandmarkClassifier`
  - Uses the same explicit feature pipeline.
  - Trains with MLX on Apple silicon macOS by default, with a scikit-learn fallback on other platforms.
  - Loads either an MLX `.npz` artifact or a scikit-learn `.joblib` artifact when the matching metadata marks it runtime-safe.

### 5. Temporal smoothing

- Rolling window of recent predictions
- Confidence averaging across the window
- Stability gate before lock-in
- Explicit `unknown` output when the signal is weak

### 6. Round state

- Backend-owned phases:
  - `idle`
  - `waiting_for_hand`
  - `hand_detected`
  - `predicting`
  - `countdown`
  - `locked`
  - `reveal`
  - `result`

The frontend stays thin and primarily renders whatever the backend emits.

## Websocket protocol

Shared message and state types live in [`shared/types.ts`](./shared/types.ts).

### Client -> server

- `hello`
- `request_state`
- `set_mode`
- `advance_round`
- `reset_round`
- `start_autoplay`
- `stop_autoplay`
- `presenter_command`
- `presenter_override`
- binary JPEG frame messages

### Server -> client

- `state_snapshot`
- `mode_update`
- `hand_status`
- `prediction_update`
- `countdown_update`
- `phase_change`
- `round_locked`
- `computer_move`
- `round_result`
- `score_update`
- `classifier_status`
- `health_status`
- `error`
- `debug_ack`

## Presenter workflow

The presenter panel can:

- switch between `simulate` and `live_cv`
- latch a manual prediction override
- clear the override
- reset the round
- trigger countdown, reveal, and result
- force the computer move
- inspect phase, prediction stability, active classifier, frame age, and health messages

Overrides are intentionally latched until cleared or reset so the presenter can rescue the demo immediately.

## Learned model workflow

### Collect training data

```bash
uv run --project backend python -m backend.scripts.collect_data
```

Interactive controls:

- `1` -> label as rock
- `2` -> label as paper
- `3` -> label as scissors
- `Space` -> capture current sample
- `q` -> quit

This writes feature rows to `backend/data/gesture_samples.csv`.

### Bootstrap from public datasets

If you do not have a local `gesture_samples.csv`, the macOS MLX wrapper now bootstraps from the public TensorFlow rock-paper-scissors datasets automatically:

```bash
./backend/scripts/setup_and_train_mlx.sh
```

That flow will:

- download `rps.zip`
- download `rps-test-set.zip`
- extract landmark features into `backend/data/gesture_samples_public.csv`
- start MLX training from that CSV

You can also run those steps manually:

```bash
uv run --project backend python -m backend.scripts.download_public_rps_dataset
uv run --project backend python -m backend.scripts.prepare_public_rps_features
uv run --project backend python -m backend.scripts.train_model --backend mlx
```

### Train the model

```bash
uv run --project backend python -m backend.scripts.train_model
```

On Apple silicon macOS, `--backend auto` resolves to `mlx` and trains a small MLP.
On other platforms, it falls back to scikit-learn.

If you want the one-command macOS setup + training flow, use:

```bash
./backend/scripts/setup_and_train_mlx.sh
```

Outputs:

- `backend/models/gesture_model.npz` on MLX
- `backend/models/gesture_model.joblib` on scikit-learn
- `backend/models/gesture_model.metadata.json`

The runtime will only activate the learned classifier when:

- the feature version matches
- the metadata marks the artifact `runtime_safe`
- validation metrics pass the thresholds baked into the training script

If not, the backend falls back to the heuristic classifier automatically.

Public dataset sources used by the bootstrap scripts:

- https://storage.googleapis.com/download.tensorflow.org/data/rps.zip
- https://storage.googleapis.com/download.tensorflow.org/data/rps-test-set.zip

## Diagnostics and testing

### Backend tests

```bash
bun run test:backend
```

Covered areas:

- heuristic classifier helpers
- protocol parsing
- round state transitions

### Frontend build check

```bash
bun run build:app
```

### Replay saved frames

```bash
uv run --project backend python -m backend.scripts.replay_frames path/to/frame1.jpg path/to/frame2.jpg
```

## Notes for demo day

- If live CV is unstable, switch to `simulate`.
- If the classifier flickers, use the manual override buttons.
- If camera frames stop arriving, the backend will surface a stale-camera warning instead of freezing the round.
- The current repo does not ship a committed learned model artifact; train one locally before the showcase if you want the runtime to prefer the learned classifier over the heuristic fallback.
