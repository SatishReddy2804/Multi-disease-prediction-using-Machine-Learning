"""
Multi-Disease Cross-Risk Engine Service.
Synthesizes independent organ predictions into syndromic clusters,
calculates composite risk scores, and routes multidisciplinary referrals.
"""

import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

CROSS_RISK_DISCLAIMER = (
    "Experimental ML decision-support summary. This tool analyzes multi-organ risk trajectories "
    "across separate disease prediction models to highlight potential syndromic associations "
    "and inform clinical review. It does NOT provide a definitive diagnosis or predict medical outcomes. "
    "All findings must be evaluated by a qualified medical professional."
)

DISEASE_DISPLAY_NAMES = {
    "heart": "Cardiovascular (Heart)",
    "diabetes": "Type 2 Diabetes",
    "liver": "Hepatic (Liver)",
    "parkinsons": "Parkinson's Voice",
}

ALL_SUPPORTED_DISEASES = ["heart", "diabetes", "liver", "parkinsons"]


class CrossRiskService:
    """Service evaluating syndromic clusters across completed organ modules."""

    @staticmethod
    def analyze(predictions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes cross-risk pattern detection and radar chart data compilation.
        Only consumes valid predictions provided by the caller without silently
        substituting missing disease predictions with fabricated defaults.
        """
        if not predictions:
            raise ValueError("No disease predictions provided for cross-risk evaluation.")

        # Clean and map probabilities from input
        prob_map: Dict[str, float] = {}
        disease_results: List[Dict[str, Any]] = []

        for p in predictions:
            d_key = str(p.get("disease", "")).lower().strip()
            if d_key == "parkinson":
                d_key = "parkinsons"
            if d_key not in ALL_SUPPORTED_DISEASES:
                continue

            prob = float(p.get("probability", 0.0))
            prob = max(0.0, min(1.0, prob))
            prob_map[d_key] = prob

            disease_results.append({
                "disease": d_key,
                "display_name": DISEASE_DISPLAY_NAMES.get(d_key, d_key.title()),
                "probability": prob,
                "risk_percentage": round(prob * 100, 1),
                "risk_level": p.get("risk_level", "High" if prob >= 0.6 else ("Moderate" if prob >= 0.3 else "Low")),
                "predicted_class": p.get("predicted_class", 1 if prob >= 0.5 else 0),
                "status": "evaluated"
            })

        if not prob_map:
            raise ValueError("No supported disease predictions found (must be heart, diabetes, liver, or parkinsons).")

        evaluated_set = set(prob_map.keys())
        missing_diseases = [
            {
                "disease": d,
                "display_name": DISEASE_DISPLAY_NAMES.get(d, d.title()),
                "status": "unavailable",
                "message": f"Biomarker prediction for {DISEASE_DISPLAY_NAMES.get(d, d.title())} has not been evaluated."
            }
            for d in ALL_SUPPORTED_DISEASES
            if d not in evaluated_set
        ]

        # Execute ML engine cross-risk pattern analysis
        try:
            from ml.src.cross_risk_engine import evaluate_cross_disease_risk
            engine_input = {d: {"probability": p} for d, p in prob_map.items()}
            engine_result = evaluate_cross_disease_risk(engine_input)
        except Exception as e:
            logger.warning(f"Could not load ML cross_risk_engine ({e}), using inline syndromic evaluator.")
            engine_result = CrossRiskService._inline_evaluate(prob_map)

        # Build radar chart data ONLY for evaluated diseases (no fabricated defaults)
        radar_chart_data = [
            {
                "disease": DISEASE_DISPLAY_NAMES.get(d_key, d_key.title()),
                "disease_key": d_key,
                "score": round(prob * 100, 1),
                "probability": prob
            }
            for d_key, prob in prob_map.items()
        ]

        detected_clusters = engine_result.get("detected_clusters", [])
        primary_cluster = (
            detected_clusters[0]["cluster_name"]
            if detected_clusters
            else "Isolated or Sub-Threshold Risk Profile"
        )

        specialists = engine_result.get("recommended_specialists", ["Primary Care Physician"])
        overall_priority = engine_result.get("overall_priority", "LOW")

        return {
            "overall_priority": overall_priority,
            "primary_cluster": primary_cluster,
            "composite_risk_score": engine_result.get("composite_risk_score", round(sum(prob_map.values()) / len(prob_map), 4)),
            "detected_clusters": detected_clusters,
            "recommended_specialist": ", ".join(specialists),
            "recommended_specialists": specialists,
            "coordinated_recommendations": engine_result.get("coordinated_recommendations", []),
            "radar_chart_data": radar_chart_data,
            "scores": prob_map,  # Dictionary of {disease: probability} for evaluated diseases ONLY
            "disease_results": disease_results,
            "missing_diseases": missing_diseases,
            "total_evaluated": len(prob_map),
            "total_supported": len(ALL_SUPPORTED_DISEASES),
            "disclaimer": CROSS_RISK_DISCLAIMER,
            "medical_disclaimer": CROSS_RISK_DISCLAIMER
        }

    @staticmethod
    def _inline_evaluate(prob_map: Dict[str, float]) -> Dict[str, Any]:
        """Fallback evaluation if ML engine config is missing."""
        clusters = []
        specialists = set()

        heart_p = prob_map.get("heart")
        diab_p = prob_map.get("diabetes")
        liver_p = prob_map.get("liver")
        park_p = prob_map.get("parkinsons")

        # Multi-organ cardiometabolic cluster
        if heart_p is not None and diab_p is not None and heart_p >= 0.5 and diab_p >= 0.5:
            clusters.append({
                "cluster_id": "cardio_metabolic",
                "cluster_name": "Cardio-Metabolic Syndrome",
                "priority": "HIGH",
                "specialist": "Cardiologist & Endocrinologist",
                "description": "Concomitant hyperglycemia and cardiovascular risk accelerate micro- and macrovascular complications.",
                "recommendations": ["Coordinated cardiovascular risk assessment", "Intensive glycemic optimization", "Lipid profile workup"]
            })
            specialists.add("Cardiologist")
            specialists.add("Endocrinologist")

        # Hepato-metabolic cluster
        if diab_p is not None and liver_p is not None and diab_p >= 0.5 and liver_p >= 0.5:
            clusters.append({
                "cluster_id": "liver_metabolic",
                "cluster_name": "Hepato-Metabolic Syndrome (MASLD)",
                "priority": "HIGH",
                "specialist": "Hepatologist & Endocrinologist",
                "description": "Insulin resistance frequently triggers hepatic steatosis and transaminase elevation.",
                "recommendations": ["Liver ultrasound / elastography", "HbA1c & fasting insulin review", "Metabolic screening"]
            })
            specialists.add("Hepatologist")
            specialists.add("Endocrinologist")

        # Cardio-hepatic axis
        if heart_p is not None and liver_p is not None and heart_p >= 0.5 and liver_p >= 0.5:
            clusters.append({
                "cluster_id": "cardio_hepatic",
                "cluster_name": "Cardio-Hepatic Axis Impairment",
                "priority": "HIGH",
                "specialist": "Cardiologist & Hepatologist",
                "description": "Hepatic congestion or inflammation interacting with systemic cardiovascular stress.",
                "recommendations": ["Comprehensive hemodynamic evaluation", "Hepatic function panel"]
            })
            specialists.add("Cardiologist")
            specialists.add("Hepatologist")

        # Neurological
        if park_p is not None and park_p >= 0.5:
            clusters.append({
                "cluster_id": "neurological",
                "cluster_name": "Isolated Neuro-Motor Syndrome",
                "priority": "MEDIUM",
                "specialist": "Neurologist",
                "description": "Elevated neuro-phonatory acoustic markers indicative of motor impairment.",
                "recommendations": ["Neurological movement disorder consultation", "Phonatory follow-up"]
            })
            specialists.add("Neurologist")

        # Calculate priority
        if any(c.get("priority") == "EMERGENCY" for c in clusters):
            overall_priority = "EMERGENCY"
        elif any(c.get("priority") == "HIGH" for c in clusters):
            overall_priority = "HIGH"
        elif any(c.get("priority") == "MEDIUM" for c in clusters) or any(p >= 0.5 for p in prob_map.values()):
            overall_priority = "MEDIUM"
        else:
            overall_priority = "LOW"

        if not specialists:
            specialists.add("Primary Care Physician")

        return {
            "overall_priority": overall_priority,
            "detected_clusters": clusters,
            "recommended_specialists": list(specialists),
            "composite_risk_score": round(sum(prob_map.values()) / max(1, len(prob_map)), 4),
            "coordinated_recommendations": [rec for c in clusters for rec in c.get("recommendations", [])]
        }
