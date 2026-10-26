"""
Counterfactual What-If Simulator Module for Multi-Disease Prediction System.

Enables clinical counterfactual scenario analysis:
Modifies actionable lifestyle and biomarker parameters while locking immutable
features (age, genetics, sex), computes resulting risk deltas using the exact
trained disease models and preprocessing pipelines, and evaluates individual
intervention impacts.
"""

import logging
from typing import Dict, Any, Optional, List, Tuple
import pandas as pd
import numpy as np

from ml.src.data_ingestion import load_config
from ml.src.inference import get_inference_engine, map_risk_level

logger = logging.getLogger(__name__)

PARKINSONS_SIMULATION_WARNING = (
    "Parkinson's voice-measurement values are biomedical acoustic measurements and may not be directly "
    "modifiable by the user. This simulation is for model-behavior exploration only."
)


class WhatIfSimulator:
    """
    Simulates clinical interventions by modifying actionable features
    and computing counterfactual risk trajectory changes via the existing
    trained model and inference pipeline.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config if config is not None else load_config()
        self.engine = get_inference_engine(self.config)

    def get_modifiable_features(self, disease_name: str) -> List[Dict[str, Any]]:
        """
        Return the list of allowed modifiable features and their ranges for a disease.
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
        Run counterfactual scenario through the existing model pipeline.

        Args:
            disease_name: Disease identifier ('heart', 'diabetes', 'parkinsons', 'liver').
            original_input: Baseline patient parameters (complete feature set).
            modifications: Dictionary of counterfactual modifications {feature_name: new_value}.

        Returns:
            Dictionary comparing baseline risk to counterfactual risk,
            individual intervention impacts, and clinical targets.
        """
        disease_name = disease_name.lower().strip()
        if disease_name == "parkinson":
            disease_name = "parkinsons"

        if disease_name not in ["heart", "diabetes", "parkinsons", "liver"]:
            raise ValueError(f"Unsupported disease '{disease_name}'. Must be heart, diabetes, parkinsons, or liver.")

        if not original_input:
            raise ValueError(f"Original input for '{disease_name}' cannot be empty.")

        mod_cfg = self.config.get("modifiable_features", {}).get(disease_name, {})
        allowed_features = {f["name"]: f for f in mod_cfg.get("modifiable", [])}
        non_modifiable = set(mod_cfg.get("non_modifiable", []))

        # Filter and validate modifications — reject invalid modifications rather than silently clamping
        valid_mods: Dict[str, Dict[str, Any]] = {}
        rejected_mods: Dict[str, str] = {}

        for k, val in modifications.items():
            if k in non_modifiable:
                rejected_mods[k] = f"Feature '{k}' is non-modifiable (immutable clinical/demographic factor)."
                continue

            if k not in allowed_features:
                rejected_mods[k] = f"Feature '{k}' is not registered as an actionable parameter for {disease_name}."
                continue

            try:
                f_val = float(val)
            except (ValueError, TypeError):
                rejected_mods[k] = f"Invalid numeric value '{val}' for feature '{k}'."
                continue

            spec = allowed_features[k]
            min_val = spec.get("min", float("-inf"))
            max_val = spec.get("max", float("inf"))

            # Reject out-of-bounds values rather than silently clamping
            if f_val < min_val or f_val > max_val:
                rejected_mods[k] = (
                    f"Value {f_val} for '{spec.get('display_name', k)}' is out of acceptable clinical range "
                    f"[{min_val}, {max_val}] {spec.get('unit', '')}."
                )
                continue

            orig_val = original_input.get(k)
            try:
                orig_float = float(orig_val) if orig_val is not None else f_val
            except (ValueError, TypeError):
                orig_float = f_val

            valid_mods[k] = {
                "original_value": orig_float,
                "modified_value": f_val,
                "display_name": spec.get("display_name", k),
                "unit": spec.get("unit", ""),
                "healthy_target": spec.get("healthy_target", None)
            }

        if rejected_mods and not valid_mods:
            first_err = next(iter(rejected_mods.values()))
            raise ValueError(first_err)

        # 1. Baseline prediction (using existing trained disease model & preprocessing)
        base_res = self.engine.predict(disease_name, original_input)
        base_prob = float(base_res["probability"])
        base_risk = base_res["risk_level"]
        base_pred = base_res.get("prediction", 1 if base_prob >= 0.50 else 0)

        # 2. Combined counterfactual input (copy original, apply modifications)
        counterfactual_input = dict(original_input)
        changed_features = []
        for k, meta in valid_mods.items():
            counterfactual_input[k] = meta["modified_value"]
            diff = round(meta["modified_value"] - meta["original_value"], 4)
            changed_features.append({
                "feature": k,
                "display_name": meta["display_name"],
                "original_value": meta["original_value"],
                "modified_value": meta["modified_value"],
                "unit": meta["unit"],
                "difference": diff,
                "healthy_target": meta["healthy_target"],
            })

        # Run modified prediction through exact same pipeline
        sim_res = self.engine.predict(disease_name, counterfactual_input)
        new_prob = float(sim_res["probability"])
        new_risk = sim_res["risk_level"]
        new_pred = sim_res.get("prediction", 1 if new_prob >= 0.50 else 0)

        # Exact probability differences
        absolute_change = round(new_prob - base_prob, 4)
        pct_points_change = round(absolute_change * 100, 1)

        if base_prob > 0:
            relative_change_pct = round(((new_prob - base_prob) / base_prob) * 100, 2)
        else:
            relative_change_pct = None

        if new_prob > base_prob:
            risk_direction = "increased"
        elif new_prob < base_prob:
            risk_direction = "decreased"
        else:
            risk_direction = "no_change"

        # 3. Individual marginal impact analysis
        # Isolate the contribution of each intervention alone
        intervention_rankings = []
        for k, meta in valid_mods.items():
            single_mod_input = dict(original_input)
            single_mod_input[k] = meta["modified_value"]

            single_res = self.engine.predict(disease_name, single_mod_input)
            marginal_prob = float(single_res["probability"])
            marginal_delta = round(marginal_prob - base_prob, 4)

            intervention_rankings.append({
                "feature": k,
                "display_name": meta["display_name"],
                "original_value": meta["original_value"],
                "simulated_value": meta["modified_value"],
                "unit": meta["unit"],
                "marginal_risk_delta": marginal_delta,
                "marginal_pct_change": round(marginal_delta * 100, 1),
                "impactScore": round(marginal_delta * 100, 1),
                "is_beneficial": marginal_delta < 0,
                "healthy_target": meta["healthy_target"]
            })

        # Sort interventions by impact (greatest risk reduction first)
        intervention_rankings.sort(key=lambda x: x["marginal_risk_delta"])

        # Determine clinical recommendation message
        if absolute_change <= -0.15:
            recommendation = "Substantial risk reduction achievable with proposed lifestyle/therapeutic modifications."
        elif absolute_change < 0:
            recommendation = "Moderate risk reduction observed. Parameter adjustments move profile toward lower risk."
        elif absolute_change == 0:
            recommendation = "No measurable change in risk probability under this parameter configuration."
        else:
            recommendation = "Proposed parameter adjustments increase clinical risk. Modification cautioned."

        # Add Parkinson's specific educational note if applicable
        specific_note = PARKINSONS_SIMULATION_WARNING if disease_name == "parkinsons" else None

        return {
            "disease_type": disease_name,
            "disease": disease_name,
            "original_risk": {
                "probability": base_prob,
                "risk_percentage": round(base_prob * 100, 1),
                "prediction": base_pred,
                "risk_level": base_risk
            },
            "modified_risk": {
                "probability": new_prob,
                "risk_percentage": round(new_prob * 100, 1),
                "prediction": new_pred,
                "risk_level": new_risk
            },
            "what_if_result": {
                "risk_direction": risk_direction,
                "absolute_change": absolute_change,
                "percentage_points_change": pct_points_change,
                "relative_change_percent": relative_change_pct,
                "changed_features": changed_features,
                "message": recommendation,
                "specific_note": specific_note,
            },
            "model_used": base_res.get("model_name", "Trained Disease Estimator"),
            "ranked_interventions": intervention_rankings,
            "rejected_modifications": rejected_mods,
            # Top-level legacy aliases for maximum client compatibility
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
                "probability_delta": absolute_change,
                "percentage_points_change": pct_points_change,
                "relative_change_percent": relative_change_pct,
                "risk_direction": risk_direction,
                "risk_shift": f"{base_risk} -> {new_risk}",
                "recommendation": recommendation
            }
        }


def run_what_if_simulation(
    disease_name: str,
    original_input: Dict[str, Any],
    modifications: Dict[str, Any]
) -> Dict[str, Any]:
    """Convenience functional wrapper for what-if simulation."""
    simulator = WhatIfSimulator()
    return simulator.simulate(disease_name, original_input, modifications)
