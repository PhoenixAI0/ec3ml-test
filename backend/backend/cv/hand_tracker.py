from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).resolve().parents[2] / ".mplconfig"))
os.environ.setdefault("XDG_CACHE_HOME", str(Path(__file__).resolve().parents[2] / ".cache"))

try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision
except ImportError:  # pragma: no cover - exercised only when dependency is missing
    mp = None
    mp_python = None
    vision = None


@dataclass(slots=True)
class HandObservation:
    landmarks: np.ndarray
    handedness: str | None


class HandTracker:
    def __init__(self, model_path: Path | None = None) -> None:
        self.model_path = model_path or (
            Path(__file__).resolve().parents[2] / "models" / "hand_landmarker.task"
        )
        self.available = False
        self.reason: str | None = None
        self._landmarker = None

        if mp is None or mp_python is None or vision is None:
            self.reason = "mediapipe not installed"
            return
        if not self.model_path.exists():
            self.reason = f"missing model asset: {self.model_path.name}"
            return

        options = vision.HandLandmarkerOptions(
            base_options=mp_python.BaseOptions(
                model_asset_path=str(self.model_path),
                delegate=mp_python.BaseOptions.Delegate.CPU,
            ),
            running_mode=vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            min_hand_presence_confidence=0.5,
        )
        try:
            self._landmarker = vision.HandLandmarker.create_from_options(options)
        except RuntimeError as exc:
            self.reason = str(exc)
            self._landmarker = None
            return
        self.available = True

    def detect(self, bgr_frame: np.ndarray) -> HandObservation | None:
        if not self.available or self._landmarker is None:
            return None

        rgb = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self._landmarker.detect(image)
        if not result.hand_landmarks:
            return None

        landmarks = np.array(
            [
                [landmark.x, landmark.y, landmark.z]
                for landmark in result.hand_landmarks[0]
            ],
            dtype=np.float32,
        )
        handedness = None
        if result.handedness:
            handedness = result.handedness[0][0].category_name

        return HandObservation(landmarks=landmarks, handedness=handedness)

    def close(self) -> None:
        if self._landmarker is not None:
            self._landmarker.close()
