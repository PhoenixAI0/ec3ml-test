from __future__ import annotations

import argparse
import csv
import json
import platform
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, f1_score, recall_score
from sklearn.model_selection import train_test_split

from backend.classifiers.mlx_model import (
    MLX_AVAILABLE,
    LandmarkMLP,
    ensure_mlx_available,
    is_mlx_supported_platform,
    optim,
    predict_mlx_probabilities,
    standardize_features,
)

FEATURE_VERSION = 1
DEFAULT_LABELS = ["rock", "paper", "scissors"]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train the RPS landmark classifier.")
    parser.add_argument(
        "--data",
        type=Path,
        default=Path("backend/data/gesture_samples.csv"),
        help="CSV file created by collect_data.py",
    )
    parser.add_argument(
        "--backend",
        choices=["auto", "mlx", "sklearn"],
        default="auto",
        help="Training backend. Defaults to MLX on Apple silicon macOS when available.",
    )
    parser.add_argument(
        "--model-out",
        type=Path,
        default=None,
        help="Output artifact path. Defaults to .npz for MLX and .joblib for sklearn.",
    )
    parser.add_argument(
        "--metadata-out",
        type=Path,
        default=Path("backend/models/gesture_model.metadata.json"),
    )
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    parser.add_argument(
        "--hidden-dims",
        type=str,
        default="128,64",
        help="Comma-separated hidden layer sizes for the MLX MLP.",
    )
    return parser


def load_csv(path: Path) -> tuple[np.ndarray, np.ndarray]:
    with path.open() as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
    if not rows:
        raise SystemExit("Training dataset is empty")

    feature_columns = sorted(
        [column for column in rows[0].keys() if column.startswith("f_")],
        key=lambda value: int(value.split("_")[1]),
    )
    labels = np.array([row["label"] for row in rows], dtype=object)
    matrix = np.array(
        [[float(row[column]) for column in feature_columns] for row in rows],
        dtype=np.float32,
    )
    return labels, matrix


def choose_backend(requested: str) -> str:
    if requested in {"mlx", "sklearn"}:
        return requested
    if is_mlx_supported_platform() and MLX_AVAILABLE:
        return "mlx"
    return "sklearn"


def hidden_dims_from_arg(raw: str) -> list[int]:
    return [int(part.strip()) for part in raw.split(",") if part.strip()]


def metrics_dict(
    y_valid: np.ndarray,
    predictions: np.ndarray,
    probabilities: np.ndarray,
    labels: list[str],
) -> dict[str, object]:
    macro_f1 = float(f1_score(y_valid, predictions, average="macro"))
    recalls = recall_score(y_valid, predictions, average=None, labels=labels)
    runtime_safe = macro_f1 >= 0.80 and bool(np.all(recalls >= 0.70))
    report = classification_report(y_valid, predictions, labels=labels, output_dict=True)
    return {
        "macro_f1": macro_f1,
        "per_class_recall": {
            str(label): float(recalls[index]) for index, label in enumerate(labels)
        },
        "runtime_safe": runtime_safe,
        "average_confidence": float(np.mean(np.max(probabilities, axis=1))),
        "confusion_matrix": confusion_matrix(y_valid, predictions, labels=labels).tolist(),
        "classification_report": report,
        "validation_examples": int(len(y_valid)),
    }


def train_sklearn(
    x_train: np.ndarray,
    y_train: np.ndarray,
    x_valid: np.ndarray,
    y_valid: np.ndarray,
    labels: list[str],
) -> tuple[object, np.ndarray, np.ndarray]:
    model = RandomForestClassifier(
        n_estimators=220,
        max_depth=16,
        min_samples_leaf=2,
        random_state=42,
    )
    model.fit(x_train, y_train)
    predictions = model.predict(x_valid)
    probabilities = model.predict_proba(x_valid)
    return model, predictions, probabilities


def train_mlx(
    x_train: np.ndarray,
    y_train: np.ndarray,
    x_valid: np.ndarray,
    y_valid: np.ndarray,
    labels: list[str],
    *,
    hidden_dims: list[int],
    learning_rate: float,
    epochs: int,
    batch_size: int,
) -> tuple[object, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    ensure_mlx_available()
    import mlx.core as mx
    import mlx.nn as nn

    x_train_norm, feature_mean, feature_std = standardize_features(x_train)
    x_valid_norm, _, _ = standardize_features(x_valid, feature_mean, feature_std)

    label_to_index = {label: index for index, label in enumerate(labels)}
    y_train_idx = np.array([label_to_index[label] for label in y_train], dtype=np.int32)
    y_valid_idx = np.array([label_to_index[label] for label in y_valid], dtype=np.int32)

    model = LandmarkMLP(
        input_dim=x_train.shape[1],
        hidden_dims=hidden_dims,
        output_dim=len(labels),
    )
    optimizer = optim.Adam(learning_rate=learning_rate)

    def loss_fn(model, batch_x, batch_y):
        logits = model(batch_x)
        return nn.losses.cross_entropy(logits, batch_y, reduction="mean")

    loss_and_grad = nn.value_and_grad(model, loss_fn)

    for epoch in range(epochs):
        order = np.random.permutation(len(x_train_norm))
        epoch_losses: list[float] = []
        for start in range(0, len(order), batch_size):
            batch_indices = order[start : start + batch_size]
            batch_x = mx.array(x_train_norm[batch_indices])
            batch_y = mx.array(y_train_idx[batch_indices])
            loss, grads = loss_and_grad(model, batch_x, batch_y)
            optimizer.update(model, grads)
            mx.eval(model.parameters(), optimizer.state, loss)
            epoch_losses.append(float(loss.item()))

        if epoch == 0 or (epoch + 1) % 10 == 0 or epoch + 1 == epochs:
            probabilities = predict_mlx_probabilities(
                model,
                x_valid,
                feature_mean=feature_mean,
                feature_std=feature_std,
            )
            predictions_idx = probabilities.argmax(axis=1)
            accuracy = float(np.mean(predictions_idx == y_valid_idx))
            print(
                f"epoch {epoch + 1:03d}/{epochs} "
                f"loss={np.mean(epoch_losses):.4f} "
                f"val_acc={accuracy:.3f}"
            )

    probabilities = predict_mlx_probabilities(
        model,
        x_valid,
        feature_mean=feature_mean,
        feature_std=feature_std,
    )
    predictions = np.array([labels[index] for index in probabilities.argmax(axis=1)], dtype=object)
    return model, predictions, probabilities, feature_mean, feature_std


def main() -> None:
    args = build_parser().parse_args()
    labels_raw, matrix = load_csv(args.data)
    labels = sorted(
        set(str(label) for label in labels_raw),
        key=lambda label: DEFAULT_LABELS.index(label) if label in DEFAULT_LABELS else len(DEFAULT_LABELS),
    )
    backend = choose_backend(args.backend)
    hidden_dims = hidden_dims_from_arg(args.hidden_dims)

    if backend == "mlx" and not is_mlx_supported_platform():
        raise SystemExit("MLX training requires Apple silicon macOS.")
    if backend == "mlx" and not MLX_AVAILABLE:
        raise SystemExit("MLX is not installed. Run `uv sync --project backend` on Apple silicon macOS.")

    x_train, x_valid, y_train, y_valid = train_test_split(
        matrix,
        labels_raw.astype(str),
        test_size=0.2,
        random_state=42,
        stratify=labels_raw.astype(str),
    )

    if args.model_out is None:
        model_out = Path("backend/models/gesture_model.npz" if backend == "mlx" else "backend/models/gesture_model.joblib")
    else:
        model_out = args.model_out

    artifact_filename = model_out.name
    if backend == "mlx":
        model, predictions, probabilities, feature_mean, feature_std = train_mlx(
            x_train,
            y_train,
            x_valid,
            y_valid,
            labels,
            hidden_dims=hidden_dims,
            learning_rate=args.learning_rate,
            epochs=args.epochs,
            batch_size=args.batch_size,
        )
    else:
        model, predictions, probabilities = train_sklearn(
            x_train,
            y_train,
            x_valid,
            y_valid,
            labels,
        )
        feature_mean = np.zeros(matrix.shape[1], dtype=np.float32)
        feature_std = np.ones(matrix.shape[1], dtype=np.float32)

    metrics = metrics_dict(y_valid, predictions, probabilities, labels)
    metadata = {
        "feature_version": FEATURE_VERSION,
        "labels": labels,
        "backend": backend,
        "model_type": "mlx_mlp" if backend == "mlx" else "sklearn_random_forest",
        "artifact_filename": artifact_filename,
        "input_dim": int(matrix.shape[1]),
        "hidden_dims": hidden_dims if backend == "mlx" else [],
        "feature_mean": feature_mean.tolist(),
        "feature_std": feature_std.tolist(),
        "platform": {
            "system": platform.system(),
            "machine": platform.machine(),
        },
        **metrics,
    }

    model_out.parent.mkdir(parents=True, exist_ok=True)
    args.metadata_out.parent.mkdir(parents=True, exist_ok=True)

    if backend == "mlx":
        model.save_weights(str(model_out))
    else:
        joblib.dump(model, model_out)
    args.metadata_out.write_text(json.dumps(metadata, indent=2))

    print("Training backend:", backend)
    print("Artifact:", model_out)
    print("Metadata:", args.metadata_out)
    print("Confusion matrix:")
    print(np.array(metrics["confusion_matrix"]))
    print()
    print("Classification report:")
    print(json.dumps(metrics["classification_report"], indent=2))
    print()
    print("Average confidence:", metrics["average_confidence"])
    print("Runtime safe:", metrics["runtime_safe"])


if __name__ == "__main__":
    main()
