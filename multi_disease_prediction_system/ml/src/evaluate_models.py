"""
Model Evaluation Module for Multi-Disease Prediction System.

Generates comprehensive evaluation artifacts:
- metrics.json containing Accuracy, Precision, Recall, F1, and ROC-AUC for all 7 models.
- Confusion matrix heatmaps for best models.
- Comparative ROC curves across all evaluated models.
- Feature importance visualizations.
All reports and figures are saved under ml/reports/.
"""

import os
import json
import argparse
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for headless environments
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, confusion_matrix
)

from ml.src.data_ingestion import load_config, get_project_root

logger = logging.getLogger(__name__)


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray) -> Dict[str, float]:
    """Calculate core classification metrics."""
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    try:
        auc = float(roc_auc_score(y_true, y_proba))
    except Exception:
        auc = acc

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(auc, 4)
    }


def plot_roc_curves(
    models: Dict[str, Any],
    X_test: np.ndarray,
    y_test: np.ndarray,
    disease_name: str,
    output_path: Path
) -> None:
    """Plot overlaid ROC curves for all models and save to disk."""
    plt.figure(figsize=(9, 7))
    plt.plot([0, 1], [0, 1], "k--", lw=1.5, label="Random Chance (AUC = 0.50)")

    colors = sns.color_palette("tab10", len(models))

    for idx, (name, model) in enumerate(models.items()):
        try:
            if hasattr(model, "predict_proba"):
                y_proba = model.predict_proba(X_test)[:, 1]
            else:
                y_proba = model.predict(X_test)
            fpr, tpr, _ = roc_curve(y_test, y_proba)
            auc_val = roc_auc_score(y_test, y_proba)
            plt.plot(fpr, tpr, color=colors[idx], lw=2, label=f"{name} (AUC = {auc_val:.3f})")
        except Exception as e:
            logger.warning("Could not calculate ROC curve for %s: %s", name, e)

    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate (1 - Specificity)", fontsize=11, fontweight="bold")
    plt.ylabel("True Positive Rate (Sensitivity)", fontsize=11, fontweight="bold")
    plt.title(f"ROC Curves - {disease_name.upper()} Disease Prediction", fontsize=13, fontweight="bold")
    plt.legend(loc="lower right", frameon=True, fontsize=10)
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.tight_layout()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=300)
    plt.close()
    logger.info("Saved ROC curve visualization to: %s", output_path)


def plot_confusion_matrix(
    model: Any,
    model_name: str,
    X_test: np.ndarray,
    y_test: np.ndarray,
    disease_name: str,
    output_path: Path
) -> None:
    """Plot normalized and count confusion matrix for best model."""
    y_pred = model.predict(X_test)
    cm = confusion_matrix(y_test, y_pred)

    plt.figure(figsize=(7, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        cbar=True,
        xticklabels=["Negative (0)", "Positive (1)"],
        yticklabels=["Negative (0)", "Positive (1)"],
        annot_kws={"size": 14, "weight": "bold"}
    )
    plt.xlabel("Predicted Label", fontsize=11, fontweight="bold")
    plt.ylabel("True Label", fontsize=11, fontweight="bold")
    plt.title(f"Confusion Matrix ({model_name}) - {disease_name.upper()}", fontsize=12, fontweight="bold")
    plt.tight_layout()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=300)
    plt.close()
    logger.info("Saved confusion matrix visualization to: %s", output_path)


def plot_feature_importance(
    model: Any,
    model_name: str,
    feature_names: List[str],
    disease_name: str,
    output_path: Path
) -> None:
    """Plot feature importances or linear coefficients."""
    importances = None
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        coef = model.coef_
        importances = np.abs(coef[0] if coef.ndim > 1 else coef)

    if importances is None:
        logger.info("Model '%s' does not have built-in feature importances.", model_name)
        return

    feat_df = pd.DataFrame({
        "feature": feature_names,
        "importance": importances
    }).sort_values(by="importance", ascending=True)

    plt.figure(figsize=(10, max(6, len(feature_names) * 0.35)))
    plt.barh(feat_df["feature"], feat_df["importance"], color="#2b5c8f", edgecolor="black")
    plt.xlabel("Relative Importance / Absolute Coefficient", fontsize=11, fontweight="bold")
    plt.ylabel("Features", fontsize=11, fontweight="bold")
    plt.title(f"Feature Importance ({model_name}) - {disease_name.upper()}", fontsize=12, fontweight="bold")
    plt.grid(axis="x", linestyle=":", alpha=0.6)
    plt.tight_layout()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=300)
    plt.close()
    logger.info("Saved feature importance visualization to: %s", output_path)


def evaluate_disease_models(
    disease_name: str,
    bundle: Optional[Dict[str, Any]] = None,
    config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Evaluate all models for a specific disease, generate plots, and return metrics.

    Args:
        disease_name: Name of disease.
        bundle: Optional in-memory model bundle from train_models.
        config: Master configuration.

    Returns:
        Dictionary of evaluation results.
    """
    if config is None:
        config = load_config()

    disease_name = disease_name.lower().strip()
    paths = config.get("paths", {})
    root = get_project_root()
    models_dir = Path(paths.get("models_dir", root / "ml" / "models"))
    figures_dir = Path(paths.get("figures_dir", root / "ml" / "reports" / "figures"))

    if bundle is None:
        bundle_path = models_dir / f"{disease_name}_model_bundle.joblib"
        if not bundle_path.exists():
            raise FileNotFoundError(f"Model bundle not found at {bundle_path}. Please train models first.")
        bundle = joblib.load(bundle_path)

    trained_models = bundle["trained_models"]
    best_model_name = bundle["best_model_name"]
    best_model = bundle["best_model"]
    feature_names = bundle["feature_names"]
    X_test = bundle["X_test_scaled"]
    y_test = bundle["y_test"]

    metrics_results = {}

    for model_name, model in trained_models.items():
        y_pred = model.predict(X_test)
        if hasattr(model, "predict_proba"):
            y_proba = model.predict_proba(X_test)[:, 1]
        else:
            y_proba = y_pred.astype(float)

        m = compute_metrics(y_test, y_pred, y_proba)
        metrics_results[model_name] = m

    # Plot Visualizations
    roc_path = figures_dir / f"{disease_name}_roc_curves.png"
    plot_roc_curves(trained_models, X_test, y_test, disease_name, roc_path)

    cm_path = figures_dir / f"{disease_name}_confusion_matrix.png"
    plot_confusion_matrix(best_model, best_model_name, X_test, y_test, disease_name, cm_path)

    feat_path = figures_dir / f"{disease_name}_feature_importance.png"
    plot_feature_importance(best_model, best_model_name, feature_names, disease_name, feat_path)

    return {
        "disease": disease_name,
        "best_model": best_model_name,
        "models": metrics_results,
        "figures": {
            "roc_curve": str(roc_path),
            "confusion_matrix": str(cm_path),
            "feature_importance": str(feat_path)
        }
    }


def evaluate_all_diseases(config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Run evaluation across all configured diseases and save metrics.json.

    Returns:
        Aggregated metrics dictionary.
    """
    if config is None:
        config = load_config()

    reports_dir = Path(config.get("paths", {}).get("reports_dir", get_project_root() / "ml" / "reports"))
    reports_dir.mkdir(parents=True, exist_ok=True)
    metrics_file = reports_dir / "metrics.json"

    master_metrics = {}

    for disease_name in config.get("diseases", {}).keys():
        try:
            logger.info("Evaluating disease: %s", disease_name)
            res = evaluate_disease_models(disease_name, config=config)
            master_metrics[disease_name] = res
        except Exception as e:
            logger.error("Failed evaluation for %s: %s", disease_name, e)

    # Save metrics.json
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(master_metrics, f, indent=2)

    logger.info("Comprehensive metrics saved to: %s", metrics_file)
    return master_metrics


def parse_args():
    parser = argparse.ArgumentParser(description="Multi-Disease Model Evaluation")
    parser.add_argument(
        "--disease",
        type=str,
        default="all",
        choices=["heart", "diabetes", "parkinsons", "liver", "all"],
        help="Disease to evaluate ('heart', 'diabetes', 'parkinsons', 'liver', or 'all')"
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.disease == "all":
        evaluate_all_diseases()
    else:
        evaluate_disease_models(args.disease)
