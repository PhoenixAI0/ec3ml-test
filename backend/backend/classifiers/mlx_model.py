from __future__ import annotations

import platform
from pathlib import Path
from typing import Any

import numpy as np

try:
    import mlx.core as mx
    import mlx.nn as nn
    import mlx.optimizers as optim
except ImportError:  # pragma: no cover - exercised only when MLX is unavailable
    mx = None
    nn = None
    optim = None


MLX_AVAILABLE = mx is not None and nn is not None and optim is not None


def is_mlx_supported_platform() -> bool:
    return platform.system() == "Darwin" and platform.machine() == "arm64"


def ensure_mlx_available() -> None:
    if not MLX_AVAILABLE:
        raise RuntimeError(
            "MLX is not installed. On Apple silicon macOS, install it with `uv sync --project backend`."
        )
    if not is_mlx_supported_platform():
        raise RuntimeError("MLX training is only supported on Apple silicon macOS.")


if MLX_AVAILABLE:

    class LandmarkMLP(nn.Module):
        def __init__(self, input_dim: int, hidden_dims: list[int], output_dim: int) -> None:
            super().__init__()
            layer_sizes = [input_dim, *hidden_dims, output_dim]
            self.layers = [
                nn.Linear(in_dim, out_dim)
                for in_dim, out_dim in zip(layer_sizes[:-1], layer_sizes[1:], strict=True)
            ]

        def __call__(self, x):
            for layer in self.layers[:-1]:
                x = mx.maximum(layer(x), 0.0)
            return self.layers[-1](x)

else:

    class LandmarkMLP:  # pragma: no cover - placeholder only when MLX is unavailable
        def __init__(self, *_args: Any, **_kwargs: Any) -> None:
            raise RuntimeError("MLX is not available")


def standardize_features(
    matrix: np.ndarray, mean: np.ndarray | None = None, std: np.ndarray | None = None
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    computed_mean = matrix.mean(axis=0, dtype=np.float64) if mean is None else mean.astype(np.float64)
    computed_std = matrix.std(axis=0, dtype=np.float64) if std is None else std.astype(np.float64)
    computed_std = np.where(computed_std < 1e-6, 1.0, computed_std)
    normalized = ((matrix - computed_mean) / computed_std).astype(np.float32)
    return normalized, computed_mean.astype(np.float32), computed_std.astype(np.float32)


def softmax_numpy(logits: np.ndarray) -> np.ndarray:
    shifted = logits - np.max(logits, axis=-1, keepdims=True)
    exp = np.exp(shifted)
    return exp / np.sum(exp, axis=-1, keepdims=True)


def load_mlx_model(
    artifact_path: Path,
    *,
    input_dim: int,
    hidden_dims: list[int],
    output_dim: int,
):
    ensure_mlx_available()
    model = LandmarkMLP(input_dim=input_dim, hidden_dims=hidden_dims, output_dim=output_dim)
    model.load_weights(str(artifact_path))
    return model


def predict_mlx_probabilities(
    model,
    matrix: np.ndarray,
    *,
    feature_mean: np.ndarray,
    feature_std: np.ndarray,
) -> np.ndarray:
    ensure_mlx_available()
    normalized, _, _ = standardize_features(matrix, feature_mean, feature_std)
    logits = model(mx.array(normalized))
    mx.eval(logits)
    logits_np = np.array(logits)
    return softmax_numpy(logits_np)
