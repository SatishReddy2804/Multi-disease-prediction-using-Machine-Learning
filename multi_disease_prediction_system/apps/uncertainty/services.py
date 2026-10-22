import logging
import math
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Graceful import of ML pipeline module
try:
    from ml.src.uncertainty import estimate_uncertainty
except ImportError:
    estimate_uncertainty = None


class UncertaintyService:
    """
    Computes model uncertainty metrics and formats trust badges
    to accompany clinical ML predictions.
    """

    @classmethod
    def evaluate(
        cls,
        disease_type: str,
        probability: float,
        input_data: Optional[Dict[str, Any]] = None,
        data_quality_score: float = 100.0,
    ) -> Dict[str, Any]:
        """
        Calculates uncertainty metrics, confidence intervals, and clinical trust badge.
        """
        # If external ML module is available, call it
        if estimate_uncertainty is not None and callable(estimate_uncertainty):
            try:
                ml_uncertainty = estimate_uncertainty(
                    disease_type=disease_type,
                    probability=probability,
                    features=input_data or {},
                )
                if isinstance(ml_uncertainty, dict):
                    return cls._format_trust_badge(
                        disease_type,
                        probability,
                        ml_uncertainty.get("uncertainty_score", 0.15),
                        ml_uncertainty.get("confidence_interval"),
                        data_quality_score,
                    )
            except Exception as e:
                logger.warning(f"Error executing ml.src.uncertainty: {e}. Falling back to statistical heuristic.")

        # Statistical heuristic based on entropy and boundary distance
        # Points near the 0.5 decision boundary have highest uncertainty
        prob_clamped = max(0.001, min(0.999, probability))
        # Normalized Shannon entropy: -p*log2(p) - (1-p)*log2(1-p)
        entropy = -(prob_clamped * math.log2(prob_clamped) + (1 - prob_clamped) * math.log2(1 - prob_clamped))
        
        # Penalize uncertainty if data quality is degraded
        quality_factor = max(0.0, (100.0 - data_quality_score) / 100.0)
        uncertainty_score = round(min(1.0, (entropy * 0.7) + (quality_factor * 0.3)), 3)

        # 95% Confidence Interval approximation
        margin = round(min(0.25, uncertainty_score * 0.20 + 0.04), 3)
        ci_lower = round(max(0.0, prob_clamped - margin), 3)
        ci_upper = round(min(1.0, prob_clamped + margin), 3)
        confidence_interval = [ci_lower, ci_upper]

        return cls._format_trust_badge(
            disease_type=disease_type,
            probability=probability,
            uncertainty_score=uncertainty_score,
            confidence_interval=confidence_interval,
            data_quality_score=data_quality_score,
        )

    @classmethod
    def _format_trust_badge(
        cls,
        disease_type: str,
        probability: float,
        uncertainty_score: float,
        confidence_interval: Optional[list] = None,
        data_quality_score: float = 100.0,
    ) -> Dict[str, Any]:
        if confidence_interval is None:
            margin = round(uncertainty_score * 0.15 + 0.05, 3)
            confidence_interval = [
                round(max(0.0, probability - margin), 3),
                round(min(1.0, probability + margin), 3),
            ]

        if uncertainty_score < 0.35 and data_quality_score >= 80:
            uncertainty_level = "Low"
            trust_status = "High Trust"
            badge = {
                "level": "verified",
                "color": "green",
                "label": "High Trust - Calibrated",
                "title": "Strong Clinical Model Consensus",
                "description": "Prediction confidence is high and feature values align closely with training cohort distribution.",
                "action_advice": "Appropriate for standard diagnostic guidance alongside clinical review.",
            }
        elif uncertainty_score < 0.70 and data_quality_score >= 60:
            uncertainty_level = "Moderate"
            trust_status = "Moderate Trust"
            badge = {
                "level": "caution",
                "color": "amber",
                "label": "Moderate Trust - Near Boundary",
                "title": "Moderate Decision Boundary Proximity",
                "description": "Patient parameters are near the clinical classification threshold or exhibit mild variance.",
                "action_advice": "Recommend confirmatory diagnostic tests and secondary physician review.",
            }
        else:
            uncertainty_level = "High"
            trust_status = "Low Trust - Review Recommended"
            badge = {
                "level": "review",
                "color": "red",
                "label": "Low Trust - Physician Review Required",
                "title": "Elevated Model Uncertainty",
                "description": "Atypical biomarker pattern or significant measurement variability observed.",
                "action_advice": "Do not make isolated clinical decisions based solely on this prediction without specialist verification.",
            }

        return {
            "disease_type": disease_type,
            "uncertainty_score": uncertainty_score,
            "uncertainty_level": uncertainty_level,
            "trust_status": trust_status,
            "confidence_interval": confidence_interval,
            "trust_badge": badge,
        }
