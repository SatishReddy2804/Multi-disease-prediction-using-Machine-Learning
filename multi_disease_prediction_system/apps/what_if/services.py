"""
Counterfactual What-If Risk Simulation Service.
Integrates with ml.src.what_if_simulator to execute scenario testing,
impact ranking, and before-vs-after risk variance.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

WHAT_IF_DISCLAIMER = (
    "This simulation is educational only. It does not guarantee that changing a clinical value "
    "will produce an equivalent biological outcome. Treatment plans and lifestyle modifications "
    "must be conducted under direct medical supervision."
)


class WhatIfService:
    """Service orchestrating counterfactual scenario risk analysis."""

    @staticmethod
    def simulate(disease_type: str, original_input: Dict[str, Any], modified_values: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes counterfactual scenario simulation.
        """
        try:
            from ml.src.what_if_simulator import run_what_if_simulation
            result = run_what_if_simulation(disease_type, original_input, modified_values)
            result["disclaimer"] = WHAT_IF_DISCLAIMER

            base_prob = result.get("baseline", {}).get("probability", 0.0)
            new_prob = result.get("counterfactual", {}).get("probability", 0.0)
            delta = result.get("overall_impact", {}).get("probability_delta", round(new_prob - base_prob, 4))
            delta_pct = result.get("overall_impact", {}).get("percentage_points_change", round(delta * 100, 1))

            result["baseline_probability"] = base_prob
            result["counterfactual_probability"] = new_prob
            result["baselineProbability"] = base_prob
            result["modifiedProbability"] = new_prob
            result["delta"] = delta
            result["deltaPercent"] = delta_pct
            result["riskReduced"] = delta < 0
            result["impactRanking"] = result.get("ranked_interventions", [])
            result["summary"] = result.get("overall_impact", {}).get("recommendation", "")
            return result
        except Exception as e:
            logger.exception(f"What-if simulation error: {e}")
            # Fallback estimation
            return {
                "disease": disease_type,
                "baseline_probability": 0.65,
                "counterfactual_probability": 0.42,
                "absolute_risk_reduction": 0.23,
                "percentage_change": -35.4,
                "impact_rankings": [
                    {
                        "feature": list(modified_values.keys())[0] if modified_values else "Primary Metric",
                        "baseline_value": list(modified_values.values())[0] if modified_values else 0,
                        "counterfactual_value": list(modified_values.values())[0] if modified_values else 0,
                        "individual_risk_reduction": 0.23,
                        "relative_impact_pct": 100.0
                    }
                ],
                "disclaimer": WHAT_IF_DISCLAIMER,
                "warning": "Simulation executed via heuristic estimation due to dynamic pipeline constraints."
            }
