"""
Model Explainability Module for Multi-Disease Prediction System.

Provides local and global patient-level interpretability using SHAP
(SHapley Additive exPlanations) with robust fallbacks to feature importance /
coefficient attribution for all supported model architectures.
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import shap

from ml.src.data_ingestion import load_config

logger = logging.getLogger(__name__)


class DiseaseExplainer:
    """
    Explainer engine providing patient-level and global risk attribution explanations.
    """

    def __init__(
        self,
        model: Any,
        model_name: str,
        feature_names: List[str],
        background_data: Optional[np.ndarray] = None,
        disease_name: str = "generic"
    ):
        """
        Initialize explainer.

        Args:
            model: Trained classifier.
            model_name: Model algorithm identifier.
            feature_names: List of ordered feature names.
            background_data: Scaled background feature matrix for SHAP baselines.
            disease_name: Name of disease.
        """
        self.model = model
        self.model_name = model_name
        self.feature_names = feature_names
        self.background_data = background_data
        self.disease_name = disease_name
        self.explainer = None
        self._init_shap_explainer()

    def _init_shap_explainer(self) -> None:
        """Initialize appropriate SHAP explainer based on model class."""
        try:
            tree_models = ["RandomForest", "XGBoost", "DecisionTree"]
            if any(tm.lower() in self.model_name.lower() for tm in tree_models):
                self.explainer = shap.TreeExplainer(self.model)
                logger.info("Initialized TreeExplainer for %s", self.model_name)
            elif "logistic" in self.model_name.lower() and self.background_data is not None:
                self.explainer = shap.LinearExplainer(self.model, self.background_data)
                logger.info("Initialized LinearExplainer for %s", self.model_name)
            elif self.background_data is not None:
                # Use a small k-means or subset summary for KernelExplainer speed
                sample_bg = self.background_data[: min(50, len(self.background_data))]
                self.explainer = shap.KernelExplainer(
                    lambda x: self.model.predict_proba(x)[:, 1] if hasattr(self.model, "predict_proba") else self.model.predict(x),
                    sample_bg
                )
                logger.info("Initialized KernelExplainer for %s", self.model_name)
        except Exception as e:
            logger.warning("Failed to initialize SHAP explainer for %s: %s. Using fallback attribution.", self.model_name, e)
            self.explainer = None

    def explain_instance(
        self,
        scaled_instance: np.ndarray,
        raw_values_dict: Optional[Dict[str, Any]] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Explain a single patient instance.

        Args:
            scaled_instance: 2D array of shape (1, num_features).
            raw_values_dict: Dictionary of unscaled input values for patient-facing reporting.
            top_k: Number of top drivers to return for positive and negative contributions.

        Returns:
            Structured explanation dictionary.
        """
        if scaled_instance.ndim == 1:
            scaled_instance = scaled_instance.reshape(1, -1)

        raw_dict = raw_values_dict or {f: float(scaled_instance[0, i]) for i, f in enumerate(self.feature_names)}

        # Try SHAP computation
        shap_values_vector = None
        base_value = 0.5

        if self.explainer is not None:
            try:
                raw_shap = self.explainer.shap_values(scaled_instance)
                # Handle various SHAP output formats (list for classes, ndarray)
                if isinstance(raw_shap, list):
                    # Class 1 (disease positive)
                    vals = raw_shap[1] if len(raw_shap) > 1 else raw_shap[0]
                elif hasattr(raw_shap, "values"):
                    vals = raw_shap.values
                else:
                    vals = raw_shap

                vals = np.asarray(vals)
                if vals.ndim == 3:
                    # shape (samples, features, classes)
                    vals = vals[:, :, 1]
                if vals.ndim == 2:
                    vals = vals[0]
                elif vals.ndim > 2:
                    vals = vals.flatten()[: len(self.feature_names)]

                shap_values_vector = vals.astype(float)

                if hasattr(self.explainer, "expected_value"):
                    ev = self.explainer.expected_value
                    base_value = float(ev[1] if isinstance(ev, (list, np.ndarray)) and len(ev) > 1 else (ev[0] if isinstance(ev, (list, np.ndarray)) else ev))
            except Exception as e:
                logger.warning("SHAP calculation error: %s. Reverting to fallback.", e)
                shap_values_vector = None

        # Fallback to feature importance weighting if SHAP fails
        if shap_values_vector is None:
            shap_values_vector = self._fallback_attribution(scaled_instance[0])

        # Rank features
        feature_contributions = []
        for idx, feat in enumerate(self.feature_names):
            impact = float(shap_values_vector[idx])
            feature_contributions.append({
                "feature": feat,
                "impact": round(impact, 4),
                "absolute_impact": round(abs(impact), 4),
                "patient_value": raw_dict.get(feat, None),
                "direction": "RISK_INCREASING" if impact > 0 else "RISK_DECREASING"
            })

        # Sort by absolute impact
        feature_contributions.sort(key=lambda x: x["absolute_impact"], reverse=True)

        top_positive = [f for f in feature_contributions if f["impact"] > 0][:top_k]
        top_negative = [f for f in feature_contributions if f["impact"] < 0][:top_k]

        return {
            "disease": self.disease_name,
            "model_used": self.model_name,
            "base_value": round(base_value, 4),
            "top_risk_drivers": top_positive,
            "top_protective_factors": top_negative,
            "all_attributions": feature_contributions
        }

    def _fallback_attribution(self, instance_vector: np.ndarray) -> np.ndarray:
        """
        Fallback attribution method using feature importances or model coefficients.
        """
        weights = None
        if hasattr(self.model, "feature_importances_"):
            weights = self.model.feature_importances_
            # Direction inferred from sign of centered feature value
            return weights * instance_vector
        elif hasattr(self.model, "coef_"):
            coef = self.model.coef_
            weights = coef[0] if coef.ndim > 1 else coef
            return weights * instance_vector

        # Equal weighting fallback
        return instance_vector / max(1, len(instance_vector))

    def generate_explanation_plot(
        self,
        explanation: Dict[str, Any],
        output_path: Path
    ) -> str:
        """
        Generate a bar plot visualization of patient risk drivers and protective factors.

        Args:
            explanation: Dict returned by explain_instance().
            output_path: File path to save the generated image.

        Returns:
            Absolute file path string of saved image.
        """
        top_drivers = explanation.get("all_attributions", [])[:10]
        if not top_drivers:
            return ""

        # Reverse order for horizontal plot (highest impact at top)
        plot_items = list(reversed(top_drivers))
        names = [item["feature"] for item in plot_items]
        impacts = [item["impact"] for item in plot_items]
        colors = ["#d9534f" if imp > 0 else "#28a745" for imp in impacts]

        plt.figure(figsize=(9, 5))
        bars = plt.barh(names, impacts, color=colors, edgecolor="black", alpha=0.85)
        plt.axvline(0, color="black", linestyle="--", lw=1)
        plt.xlabel("SHAP Value (Impact on Prediction Risk)", fontsize=11, fontweight="bold")
        plt.title(
            f"Patient Risk Factor Attribution - {explanation.get('disease', '').upper()}",
            fontsize=12, fontweight="bold"
        )
        plt.grid(axis="x", linestyle=":", alpha=0.6)

        # Annotate values
        for bar in bars:
            val = bar.get_width()
            offset = 0.005 if val >= 0 else -0.015
            plt.text(
                val + offset,
                bar.get_y() + bar.get_height() / 2,
                f"{val:+.3f}",
                va="center",
                fontsize=9,
                fontweight="bold"
            )

        plt.tight_layout()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(output_path, dpi=300)
        plt.close()

        logger.info("Saved explainability plot to: %s", output_path)
        return str(output_path)


if __name__ == "__main__":
    from ml.src.data_ingestion import load_raw_dataset
    from ml.src.data_cleaning import clean_dataset
    from ml.src.feature_engineering import FeaturePipeline
    from sklearn.ensemble import RandomForestClassifier

    print("Testing explainability module...")
    cfg = load_config()
    raw = load_raw_dataset("heart", cfg)
    cleaned, _ = clean_dataset(raw, "heart", cfg)
    fp = FeaturePipeline("heart", cfg)
    prep = fp.prepare_data(cleaned)

    rf = RandomForestClassifier(n_estimators=50, random_state=42)
    rf.fit(prep["X_train_resampled"], prep["y_train_resampled"])

    explainer = DiseaseExplainer(
        model=rf,
        model_name="RandomForest",
        feature_names=prep["feature_names"],
        background_data=prep["X_train_scaled"],
        disease_name="heart"
    )

    sample = prep["X_test_scaled"][0:1]
    res = explainer.explain_instance(sample)
    print("Top risk drivers:", res["top_risk_drivers"][:2])
    print("Top protective:", res["top_protective_factors"][:2])
