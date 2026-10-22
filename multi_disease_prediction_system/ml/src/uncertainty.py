"""
Uncertainty Estimation and Trust Badge Module for Multi-Disease Prediction System.

Combines tree-vote variance, cross-model ensemble disagreement, input anomaly detection
(IsolationForest), boundary thresholding, and physician red-flag overrides to assign
trust badges and certainty scores.
"""

import logging
from typing import Dict, Any, Optional, List, Tuple
import numpy as np
import pandas as pd

from ml.src.data_ingestion import load_config
from ml.src.inference import ModelRegistry

logger = logging.getLogger(__name__)


def check_red_flags(
    disease_name: str,
    raw_inputs: Dict[str, Any],
    config: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Check if patient input triggers any physician-defined clinical red-flag rules.

    Args:
        disease_name: Name of disease.
        raw_inputs: Unscaled patient input dictionary.
        config: Master configuration.

    Returns:
        List of triggered red flag rule dictionaries.
    """
    if config is None:
        config = load_config()

    disease_name = disease_name.lower().strip()
    disease_red_flags = config.get("red_flags", {}).get(disease_name, [])
    triggered = []

    for rule in disease_red_flags:
        feature = rule.get("feature")
        threshold = rule.get("threshold")
        severity = rule.get("severity", "HIGH")
        condition = rule.get("condition", "")
        message = rule.get("message", "")

        if feature not in raw_inputs:
            continue

        try:
            val = float(raw_inputs[feature])
            is_active = False

            if ">=" in condition:
                is_active = (val >= threshold)
            elif "<=" in condition:
                is_active = (val <= threshold)
            elif ">" in condition:
                is_active = (val > threshold)
            elif "<" in condition:
                is_active = (val < threshold)
            elif "==" in condition:
                is_active = (val == threshold)

            if is_active:
                triggered.append({
                    "rule": condition,
                    "feature": feature,
                    "patient_value": val,
                    "threshold": threshold,
                    "severity": severity,
                    "message": message
                })
        except (ValueError, TypeError):
            continue

    return triggered


class UncertaintyEstimator:
    """
    Evaluates prediction reliability through ensemble variance,
    distance to decision boundary, anomaly scoring, and clinical red flags.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config if config is not None else load_config()
        self.registry = ModelRegistry(self.config)

    def evaluate_uncertainty(
        self,
        disease_name: str,
        scaled_vector: np.ndarray,
        raw_inputs: Dict[str, Any],
        predicted_probability: float
    ) -> Dict[str, Any]:
        """
        Estimate multi-faceted uncertainty for a patient prediction.

        Args:
            disease_name: Disease identifier.
            scaled_vector: Scaled 2D feature array (1, n_features).
            raw_inputs: Patient unscaled dictionary.
            predicted_probability: Probability output from best model.

        Returns:
            Dictionary containing trust badge, reliability score, and audit details.
        """
        disease_name = disease_name.lower().strip()
        bundle = self.registry.get_bundle(disease_name)

        if scaled_vector.ndim == 1:
            scaled_vector = scaled_vector.reshape(1, -1)

        # 1. Evaluate Clinical Red Flags
        red_flags = check_red_flags(disease_name, raw_inputs, self.config)

        # 2. Random Forest Tree-Vote Variance
        rf_model = bundle.get("trained_models", {}).get("RandomForest", None)
        tree_variance = 0.0
        tree_std = 0.0

        if rf_model and hasattr(rf_model, "estimators_"):
            try:
                tree_preds = [
                    tree.predict_proba(scaled_vector)[0, 1]
                    for tree in rf_model.estimators_
                ]
                tree_variance = float(np.var(tree_preds))
                tree_std = float(np.std(tree_preds))
            except Exception as e:
                logger.warning("Error computing RF tree variance: %s", e)

        # 3. Cross-Model Ensemble Disagreement
        all_models = bundle.get("trained_models", {})
        model_probs = []
        for m_name, m_obj in all_models.items():
            try:
                if hasattr(m_obj, "predict_proba"):
                    pr = float(m_obj.predict_proba(scaled_vector)[0, 1])
                else:
                    pr = float(m_obj.predict(scaled_vector)[0])
                model_probs.append(pr)
            except Exception:
                pass

        ensemble_variance = float(np.var(model_probs)) if len(model_probs) > 1 else tree_variance
        ensemble_std = float(np.std(model_probs)) if len(model_probs) > 1 else tree_std

        # 4. Out-of-Distribution / Anomaly Detection
        isolation_forest = bundle.get("isolation_forest", None)
        is_ood = False
        anomaly_score = 0.0

        if isolation_forest:
            try:
                # -1 for anomaly, 1 for inlier
                iso_pred = isolation_forest.predict(scaled_vector)[0]
                anomaly_score = float(isolation_forest.decision_function(scaled_vector)[0])
                is_ood = (iso_pred == -1)
            except Exception as e:
                logger.warning("Error running anomaly detection: %s", e)

        # 5. Boundary Uncertainty (Distance from decision boundary 0.5)
        boundary_dist = abs(predicted_probability - 0.5)
        near_boundary = (boundary_dist < 0.10)  # probability between 0.40 and 0.60

        # 6. Assign Trust Classification & Score
        # Scoring scale 0 - 100
        # Start at 100, penalize for uncertainty factors
        base_score = 95.0

        # Boundary penalty: up to 25 points if near 0.5
        boundary_penalty = max(0.0, (0.10 - boundary_dist) * 250.0)
        # Variance penalty: up to 20 points
        variance_penalty = min(25.0, ensemble_variance * 200.0)
        # Anomaly penalty
        ood_penalty = 30.0 if is_ood else max(0.0, -anomaly_score * 30.0)

        trust_score = max(10.0, min(99.0, base_score - boundary_penalty - variance_penalty - ood_penalty))

        # Classification Hierarchy
        if len(red_flags) > 0:
            classification = "CRITICAL_RED_FLAG"
            badge_color = "red"
            summary = "Critical clinical anomaly detected requiring immediate medical attention."
        elif is_ood:
            classification = "OUT_OF_DISTRIBUTION"
            badge_color = "purple"
            trust_score = min(trust_score, 45.0)
            summary = "Patient measurements deviate significantly from training reference population."
        elif near_boundary or ensemble_variance > 0.06 or tree_variance > 0.08:
            classification = "UNCERTAIN"
            badge_color = "amber"
            trust_score = min(trust_score, 68.0)
            summary = "Prediction is near the clinical decision boundary; model consensus has moderate variance."
        else:
            classification = "RELIABLE"
            badge_color = "green"
            trust_score = max(trust_score, 82.0)
            summary = "High confidence prediction supported by consistent ensemble agreement and inlier status."

        return {
            "classification": classification,
            "badge_color": badge_color,
            "trust_score": round(trust_score, 1),
            "summary": summary,
            "metrics": {
                "tree_variance": round(tree_variance, 4),
                "tree_std": round(tree_std, 4),
                "ensemble_variance": round(ensemble_variance, 4),
                "ensemble_std": round(ensemble_std, 4),
                "anomaly_score": round(anomaly_score, 4),
                "boundary_distance": round(boundary_dist, 4),
                "is_out_of_distribution": is_ood
            },
            "red_flags": red_flags
        }


def assess_prediction_uncertainty(
    disease_name: str,
    scaled_vector: np.ndarray,
    raw_inputs: Dict[str, Any],
    predicted_probability: float
) -> Dict[str, Any]:
    """Convenience wrapper for assessing prediction uncertainty."""
    estimator = UncertaintyEstimator()
    return estimator.evaluate_uncertainty(
        disease_name=disease_name,
        scaled_vector=scaled_vector,
        raw_inputs=raw_inputs,
        predicted_probability=predicted_probability
    )


if __name__ == "__main__":
    print("Testing uncertainty module...")
    test_inputs = {"trestbps": 195, "oldpeak": 4.5, "thalach": 120}
    flags = check_red_flags("heart", test_inputs)
    print("Triggered red flags:", flags)
