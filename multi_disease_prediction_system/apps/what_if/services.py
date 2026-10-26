"""
Counterfactual What-If Risk Simulation Service.
Integrates with ml.src.what_if_simulator to execute scenario testing,
impact ranking, and before-vs-after risk variance using trained models.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

WHAT_IF_DISCLAIMER = (
    "What-If results are simulated educational estimates. They do not guarantee that changing a clinical value "
    "will change an actual medical outcome. Always consult a qualified doctor for diagnosis, treatment, or medication decisions."
)


class WhatIfService:
    """Service orchestrating counterfactual scenario risk analysis without fabricated defaults."""

    @staticmethod
    def simulate(disease_type: str, original_input: Dict[str, Any], modified_values: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes counterfactual scenario simulation using the existing trained disease model.
        Never returns fabricated probability fallbacks if inference fails.
        """
        try:
            from ml.src.what_if_simulator import run_what_if_simulation
            result = run_what_if_simulation(disease_type, original_input, modified_values)
            result["disclaimer"] = WHAT_IF_DISCLAIMER
            result["medical_disclaimer"] = WHAT_IF_DISCLAIMER
            if "what_if_result" in result:
                result["what_if_result"]["disclaimer"] = WHAT_IF_DISCLAIMER

            # Ensure consistent legacy aliases expected by various frontend components
            base_prob = result["original_risk"]["probability"]
            new_prob = result["modified_risk"]["probability"]
            delta = result["what_if_result"]["absolute_change"]
            delta_pct = result["what_if_result"]["percentage_points_change"]

            result["baseline_probability"] = base_prob
            result["counterfactual_probability"] = new_prob
            result["baselineProbability"] = base_prob
            result["modifiedProbability"] = new_prob
            result["delta"] = delta
            result["deltaPercent"] = delta_pct
            result["riskReduced"] = delta < 0
            result["impactRanking"] = [
                {
                    "feature": item["display_name"],
                    "raw_feature": item["feature"],
                    "originalValue": item["original_value"],
                    "modifiedValue": item["simulated_value"],
                    "impactScore": item["marginal_pct_change"],
                    "marginalRiskDelta": item["marginal_risk_delta"],
                    "unit": item["unit"],
                    "isBeneficial": item["is_beneficial"],
                    "healthyTarget": item["healthy_target"]
                }
                for item in result.get("ranked_interventions", [])
            ]
            result["summary"] = result["what_if_result"]["message"]
            return result
        except Exception as e:
            logger.exception("Error executing genuine what-if simulation for %s: %s", disease_type, e)
            # Re-raise so the view returns a genuine HTTP error rather than returning fake numbers
            raise
