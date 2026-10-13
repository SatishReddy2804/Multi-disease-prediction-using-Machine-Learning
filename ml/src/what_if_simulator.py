"""
Counterfactual What-If Simulator Module for Multi-Disease Prediction System.

Enables clinical counterfactual scenario analysis:
Modifies actionable lifestyle and biomarker parameters while locking immutable
features (age, genetics, sex), computes resulting risk deltas, and isolates
individual intervention impacts.
"""

import logging
from typing import Dict, Any, Optional, List, Tuple
import pandas as pd
import numpy as np

from ml.src.data_ingestion import load_config
from ml.src.inference import get_inference_engine, map_risk_level

logger = logging.getLogger(__name__)


class WhatIfSimulator:
    """
    Simulates clinical interventions by modifying actionable features
    and computing counterfactual risk trajectory changes.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config if config is not None else load_config()
        self.engine = get_inference_engine(self.config)

    def get_modifiable_features(self, disease_name: str) -> List[Dict[str, Any]]:
        """
        Return the list of allowed modifiable features and their ranges for a disease.

        Args:
            disease_name: Disease identifier.

        Returns:
            List of feature metadata dictionaries.
        """
        disease_name = disease_name.lower().strip()
        mod_cfg = self.config.get("modifiable_features", {}).get(disease_name, {})
        return mod_cfg.get("modifiable", [])

    def simulate(
        self,
        disease_name: str,
        original_input: Dict[str, Any],
        modifications: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Run counterfactual scenario.

        Args:
            disease_name: Disease identifier ('heart', 'diabetes', 'parkinsons', 'liver').
            original_input: Baseline patient parameters.
            modifications: Dictionary of counterfactual modifications {feature_name: new_value}.

        Returns:
            Dictionary comparing baseline risk to counterfactual risk,
            individual intervention impacts, and clinical targets.
        """
        disease_name = disease_name.lower().strip()
        mod_cfg = self.config.get("modifiable_features", {}).get(disease_name, {})
        allowed_features = {f["name"]: f for f in mod_cfg.get("modifiable", [])}
        non_modifiable = set(mod_cfg.get("non_modifiable", []))

        # Filter and validate modifications
        valid_mods = {}
        rejected_mods = {}

        for k, val in modifications.items():
            if k in non_modifiable:
                rejected_mods[k] = f"Feature '{k}' is non-modifiable (immutable clinical/demographic factor)."
                continue

            if k not in allowed_features:
                rejected_mods[k] = f"Feature '{k}' is not registered as an actionable parameter."
                continue

            # Check bounds
            spec = allowed_features[k]
            f_val = float(val)
            min_val = spec.get("min", float("-inf"))
            max_val = spec.get("max", float("inf"))
            clamped_val = max(min_val, min(max_val, f_val))

            valid_mods[k] = {
                "original_value": float(original_input.get(k, 0.0)),
                "modified_value": clamped_val,
                "display_name": spec.get("display_name", k),
                "unit": spec.get("unit", ""),
                "healthy_target": spec.get("healthy_target", None)
            }

        # 1. Baseline prediction
        base_res = self.engine.predict(disease_name, original_input)
        base_prob = base_res["probability"]
        base_risk = base_res["risk_level"]

        # 2. Combined counterfactual input
        counterfactual_input = dict(original_input)
        for k, meta in valid_mods.items():
            counterfactual_input[k] = meta["modified_value"]

        sim_res = self.engine.predict(disease_name, counterfactual_input)
        new_prob = sim_res["probability"]
        new_risk = sim_res["risk_level"]

        overall_delta = round(new_prob - base_prob, 4)
        pct_points_change = round(overall_delta * 100, 1)

        # 3. Individual marginal impact analysis
        # (Isolate the contribution of each intervention alone)
        intervention_rankings = []
        for k, meta in valid_mods.items():
            single_mod_input = dict(original_input)
            single_mod_input[k] = meta["modified_value"]

            single_res = self.engine.predict(disease_name, single_mod_input)
            marginal_prob = single_res["probability"]
            marginal_delta = round(marginal_prob - base_prob, 4)

            intervention_rankings.append({
                "feature": k,
                "display_name": meta["display_name"],
                "original_value": meta["original_value"],
                "simulated_value": meta["modified_value"],
                "unit": meta["unit"],
                "marginal_risk_delta": marginal_delta,
                "marginal_pct_change": round(marginal_delta * 100, 1),
                "is_beneficial": marginal_delta < 0,
                "healthy_target": meta["healthy_target"]
            })

        # Sort interventions by impact (greatest risk reduction first)
        intervention_rankings.sort(key=lambda x: x["marginal_risk_delta"])

        # Determine clinical recommendation tone
        if overall_delta <= -0.15:
            recommendation = "Substantial risk reduction achievable with proposed lifestyle/therapeutic modifications."
        elif overall_delta < 0:
            recommendation = "Moderate risk reduction observed. Continued adherence recommended."
        elif overall_delta == 0:
            recommendation = "No measurable change in risk probability under this configuration."
        else:
            recommendation = "Proposed parameter adjustments increase clinical risk. Modification cautioned."

        return {
            "disease": disease_name,
            "baseline": {
                "probability": base_prob,
                "risk_percentage": round(base_prob * 100, 1),
                "risk_level": base_risk
            },
            "counterfactual": {
                "probability": new_prob,
                "risk_percentage": round(new_prob * 100, 1),
                "risk_level": new_risk
            },
            "overall_impact": {
                "probability_delta": overall_delta,
                "percentage_points_change": pct_points_change,
                "risk_shift": f"{base_risk} -> {new_risk}",
                "recommendation": recommendation
            },
            "ranked_interventions": intervention_rankings,
            "rejected_modifications": rejected_mods
        }


def run_what_if_simulation(
    disease_name: str,
    original_input: Dict[str, Any],
    modifications: Dict[str, Any]
) -> Dict[str, Any]:
    """Convenience functional wrapper for what-if simulation."""
    simulator = WhatIfSimulator()
    return simulator.simulate(disease_name, original_input, modifications)


if __name__ == "__main__":
    print("Testing what-if simulation module...")
    test_orig = {"age": 55, "sex": 1, "trestbps": 160, "chol": 280, "thalach": 130}
    test_mods = {"trestbps": 120, "chol": 190, "age": 40}  # age is non-modifiable
    try:
        sim = run_what_if_simulation("heart", test_orig, test_mods)
        print("Simulation result:", sim["overall_impact"])
        print("Rejected:", sim["rejected_modifications"])
    except Exception as err:
        print("Model bundle required for live run:", err)
