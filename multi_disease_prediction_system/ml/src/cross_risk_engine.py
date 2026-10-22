"""
Multi-Disease Cross-Risk Analysis Engine.

Analyzes holistic patient risk trajectories across multiple organ systems
(Cardiovascular, Endocrine/Metabolic, Hepatic, Neurological) to detect
syndromic clusters, assign triage priorities, and guide specialist referrals.
"""

import logging
from typing import Dict, Any, Optional, List, Union

from ml.src.data_ingestion import load_config

logger = logging.getLogger(__name__)


class CrossRiskEngine:
    """
    Evaluates cross-organ interactions and syndromic co-morbidities.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config if config is not None else load_config()
        self.patterns = self.config.get("cross_risk_patterns", {})

    def analyze(self, predictions: Dict[str, Union[Dict[str, Any], float]]) -> Dict[str, Any]:
        """
        Analyze predictions from multiple disease modules and detect risk clusters.

        Args:
            predictions: Dict mapping disease name to either its prediction result dict
                         or float probability. e.g. {"heart": {"probability": 0.81}, "diabetes": 0.74}

        Returns:
            Dictionary containing detected syndromic clusters, overall priority,
            recommended specialists, and coordinated clinical actions.
        """
        # Normalize inputs to {disease_name: probability}
        clean_probs: Dict[str, float] = {}
        for d_name, d_val in predictions.items():
            name_key = d_name.lower().strip()
            if isinstance(d_val, dict):
                p = float(d_val.get("probability", 0.0))
            else:
                p = float(d_val)
            clean_probs[name_key] = p

        high_risk_diseases = [d for d, p in clean_probs.items() if p >= 0.50]
        critical_diseases = [d for d, p in clean_probs.items() if p >= 0.75]

        detected_clusters: List[Dict[str, Any]] = []

        # 1. Multi-System Cross-Organ Check (3+ high-risk conditions)
        if len(high_risk_diseases) >= 3:
            ms_cfg = self.patterns.get("multi_system", {})
            detected_clusters.append({
                "cluster_id": "multi_system",
                "cluster_name": ms_cfg.get("name", "Multi-System Failure / High Cross-Organ Risk"),
                "priority": "EMERGENCY",
                "specialist": ms_cfg.get("specialist", "Internal Medicine / Multi-Disciplinary Panel"),
                "description": ms_cfg.get("description", "Concurrent high risk across multiple vital organ systems."),
                "recommendations": ms_cfg.get("recommendations", []),
                "involved_diseases": high_risk_diseases
            })

        # 2. Cardio-Metabolic Syndrome Check
        cm_cfg = self.patterns.get("cardio_metabolic", {})
        if clean_probs.get("heart", 0.0) >= 0.50 and clean_probs.get("diabetes", 0.0) >= 0.50:
            detected_clusters.append({
                "cluster_id": "cardio_metabolic",
                "cluster_name": cm_cfg.get("name", "Cardio-Metabolic Syndrome"),
                "priority": cm_cfg.get("priority", "HIGH"),
                "specialist": cm_cfg.get("specialist", "Cardiologist & Endocrinologist"),
                "description": cm_cfg.get("description", ""),
                "recommendations": cm_cfg.get("recommendations", []),
                "involved_diseases": ["heart", "diabetes"]
            })

        # 3. Hepato-Metabolic Syndrome Check
        lm_cfg = self.patterns.get("liver_metabolic", {})
        if clean_probs.get("liver", 0.0) >= 0.50 and clean_probs.get("diabetes", 0.0) >= 0.50:
            detected_clusters.append({
                "cluster_id": "liver_metabolic",
                "cluster_name": lm_cfg.get("name", "Hepato-Metabolic Syndrome (MASLD / NAFLD)"),
                "priority": lm_cfg.get("priority", "HIGH"),
                "specialist": lm_cfg.get("specialist", "Hepatologist & Endocrinologist"),
                "description": lm_cfg.get("description", ""),
                "recommendations": lm_cfg.get("recommendations", []),
                "involved_diseases": ["liver", "diabetes"]
            })

        # 4. Cardio-Hepatic Axis Check
        ch_cfg = self.patterns.get("cardio_hepatic", {})
        if clean_probs.get("heart", 0.0) >= 0.50 and clean_probs.get("liver", 0.0) >= 0.50:
            detected_clusters.append({
                "cluster_id": "cardio_hepatic",
                "cluster_name": ch_cfg.get("name", "Cardio-Hepatic Axis Impairment"),
                "priority": ch_cfg.get("priority", "HIGH"),
                "specialist": ch_cfg.get("specialist", "Cardiologist & Hepatologist"),
                "description": ch_cfg.get("description", ""),
                "recommendations": ch_cfg.get("recommendations", []),
                "involved_diseases": ["heart", "liver"]
            })

        # 5. Isolated Neurological Check
        neuro_cfg = self.patterns.get("neurological", {})
        if clean_probs.get("parkinsons", 0.0) >= 0.50:
            detected_clusters.append({
                "cluster_id": "neurological",
                "cluster_name": neuro_cfg.get("name", "Isolated Neuro-Motor Syndrome"),
                "priority": neuro_cfg.get("priority", "MEDIUM"),
                "specialist": neuro_cfg.get("specialist", "Neurologist (Movement Disorder Specialist)"),
                "description": neuro_cfg.get("description", ""),
                "recommendations": neuro_cfg.get("recommendations", []),
                "involved_diseases": ["parkinsons"]
            })

        # Aggregate Priority & Specialist Recommendations
        priority_levels = ["LOW", "MEDIUM", "HIGH", "EMERGENCY"]
        highest_priority = "LOW"
        all_specialists = set()
        all_recommendations = []

        if detected_clusters:
            # Determine maximum priority
            max_idx = 0
            for cl in detected_clusters:
                p_str = cl["priority"].upper()
                idx = priority_levels.index(p_str) if p_str in priority_levels else 1
                if idx > max_idx:
                    max_idx = idx
                for s in cl["specialist"].split("&"):
                    all_specialists.add(s.strip())
                all_recommendations.extend(cl["recommendations"])
            highest_priority = priority_levels[max_idx]
        elif high_risk_diseases:
            # Isolated single disease high risk without multi-organ cluster
            highest_priority = "HIGH"
            single_disease_specialist_map = {
                "heart": "Cardiologist",
                "diabetes": "Endocrinologist",
                "liver": "Hepatologist",
                "parkinsons": "Neurologist"
            }
            for d in high_risk_diseases:
                all_specialists.add(single_disease_specialist_map.get(d, "Specialist Physician"))
        else:
            highest_priority = "LOW"
            all_specialists.add("Primary Care Physician (Preventive Health)")
            all_recommendations.append("Continue routine annual wellness screenings and balanced lifestyle habits.")

        # Overall composite cross-risk score (mean of available probabilities)
        composite_score = round(float(sum(clean_probs.values()) / max(1, len(clean_probs))), 4)

        return {
            "composite_risk_score": composite_score,
            "overall_priority": highest_priority,
            "detected_clusters": detected_clusters,
            "high_risk_diseases": high_risk_diseases,
            "critical_diseases": critical_diseases,
            "recommended_specialists": list(all_specialists),
            "coordinated_recommendations": list(dict.fromkeys(all_recommendations)),
            "evaluated_probabilities": clean_probs
        }


def evaluate_cross_disease_risk(predictions: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function to analyze cross-disease risk."""
    engine = CrossRiskEngine()
    return engine.analyze(predictions)


if __name__ == "__main__":
    print("Testing cross-risk engine...")
    test_preds = {
        "heart": {"probability": 0.82, "risk_level": "Critical"},
        "diabetes": {"probability": 0.76, "risk_level": "Critical"},
        "liver": {"probability": 0.35, "risk_level": "Moderate"},
        "parkinsons": {"probability": 0.12, "risk_level": "Low"}
    }
    result = evaluate_cross_disease_risk(test_preds)
    print("Cross-Risk Priority:", result["overall_priority"])
    print("Clusters:", [c["cluster_name"] for c in result["detected_clusters"]])
    print("Specialists:", result["recommended_specialists"])
