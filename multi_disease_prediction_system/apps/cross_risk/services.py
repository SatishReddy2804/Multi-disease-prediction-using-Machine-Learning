"""
Multi-Disease Cross-Risk Engine Service.
Synthesizes independent organ predictions into syndromic clusters,
calculates composite risk scores, and routes multidisciplinary referrals.
"""

import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

CROSS_RISK_DISCLAIMER = (
    "Cross-risk syndromic patterns identify comorbid metabolic and vascular associations across organ systems. "
    "These findings do not constitute a definitive multi-organ diagnosis. Patients presenting with elevated "
    "cross-risk should seek coordinated care from an internist or designated medical specialists."
)


class CrossRiskService:
    """Service evaluating syndromic clusters across completed organ modules."""

    @staticmethod
    def analyze(predictions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes cross-risk pattern detection and radar chart data compilation.
        """
        try:
            from ml.src.cross_risk_engine import evaluate_cross_disease_risk
            preds_dict = {p["disease"]: p for p in predictions}
            result = evaluate_cross_disease_risk(preds_dict)
            result["disclaimer"] = CROSS_RISK_DISCLAIMER
            return result
        except Exception as e:
            logger.exception(f"Cross-risk analysis engine error: {e}")

            # Robust fallback evaluation
            prob_map = {p["disease"]: p["probability"] for p in predictions}
            heart_p = prob_map.get("heart", 0.2)
            diab_p = prob_map.get("diabetes", 0.2)
            liver_p = prob_map.get("liver", 0.2)
            park_p = prob_map.get("parkinsons", 0.1)

            clusters = []
            if heart_p > 0.5 and diab_p > 0.5:
                clusters.append({
                    "cluster_name": "Cardio-Metabolic Syndrome",
                    "severity": "HIGH",
                    "organs_involved": ["Heart", "Metabolic / Diabetes"],
                    "specialist": "Cardiologist & Endocrinologist",
                    "rationale": "Concomitant hyperglycemia and cardiovascular risk accelerate microvascular and macrovascular damage."
                })
            if diab_p > 0.5 and liver_p > 0.5:
                clusters.append({
                    "cluster_name": "Hepato-Metabolic Axis (MASLD)",
                    "severity": "HIGH",
                    "organs_involved": ["Liver", "Metabolic / Diabetes"],
                    "specialist": "Hepatologist & Endocrinologist",
                    "rationale": "Insulin resistance frequently triggers hepatic steatosis and elevated transaminases."
                })
            if not clusters:
                clusters.append({
                    "cluster_name": "Isolated or Sub-Threshold Risk Profile",
                    "severity": "LOW",
                    "organs_involved": [p["disease"].title() for p in predictions],
                    "specialist": "Primary Care Physician",
                    "rationale": "No syndromic multi-organ cluster exceeded the high-risk threshold."
                })

            radar_data = [
                {"disease": "Heart Disease", "score": round(heart_p * 100, 1)},
                {"disease": "Diabetes", "score": round(diab_p * 100, 1)},
                {"disease": "Liver Disease", "score": round(liver_p * 100, 1)},
                {"disease": "Parkinson's Disease", "score": round(park_p * 100, 1)},
            ]

            return {
                "individual_probabilities": prob_map,
                "detected_clusters": clusters,
                "primary_cluster": clusters[0]["cluster_name"],
                "overall_priority": clusters[0]["severity"],
                "recommended_specialist": clusters[0]["specialist"],
                "radar_chart_data": radar_data,
                "disclaimer": CROSS_RISK_DISCLAIMER
            }
