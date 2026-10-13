"""
Data Quality Scoring Module for Multi-Disease Prediction System.

Audits incoming patient records for completeness, data type integrity,
physiological range validity, conflicting clinical measurements, and
suspicious default values. Assigns a 0-100 quality score and enforces
quality gate rules (<60 Suppress, 60-80 Warning, >80 Normal).
"""

import logging
from typing import Dict, Any, Optional, List, Tuple
import numpy as np
import pandas as pd

from ml.src.data_ingestion import load_config

logger = logging.getLogger(__name__)


class DataQualityAuditor:
    """
    Evaluates clinical input quality and gates automated inferences.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config if config is not None else load_config()

    def audit_record(
        self,
        disease_name: str,
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Audit a single patient clinical record for the given disease.

        Args:
            disease_name: Disease identifier ('heart', 'diabetes', 'parkinsons', 'liver').
            input_data: Raw input dictionary containing patient biomarkers.

        Returns:
            Dictionary containing quality score (0-100), quality gate action,
            passed checks, warnings, and error messages.
        """
        disease_name = disease_name.lower().strip()
        disease_cfg = self.config.get("diseases", {}).get(disease_name, {})
        expected_features = disease_cfg.get("features", [])
        reference_ranges = self.config.get("reference_ranges", {}).get(disease_name, {})

        score = 100.0
        issues: List[Dict[str, Any]] = []
        passed_checks: List[str] = []

        # 1. Completeness Check
        missing_fields = []
        for feat in expected_features:
            val = input_data.get(feat, None)
            if val is None or val == "" or str(val).strip() in ["?", "NA", "null", "NaN"]:
                missing_fields.append(feat)

        if missing_fields:
            penalty = len(missing_fields) * 12.0
            score -= penalty
            issues.append({
                "type": "COMPLETENESS_ERROR",
                "severity": "HIGH",
                "penalty": penalty,
                "message": f"Missing critical input fields: {', '.join(missing_fields)}"
            })
        else:
            passed_checks.append("All expected features are present.")

        # 2. Type & Parse Validity
        unparseable_fields = []
        parsed_data = {}
        for feat in expected_features:
            raw_val = input_data.get(feat, None)
            if raw_val is not None:
                try:
                    # In liver, 'Gender' might be Male/Female
                    if feat.lower() == "gender" and str(raw_val).lower() in ["male", "female", "m", "f", "0", "1"]:
                        parsed_data[feat] = 1.0 if str(raw_val).lower() in ["male", "m", "1"] else 0.0
                    else:
                        parsed_data[feat] = float(raw_val)
                except (ValueError, TypeError):
                    unparseable_fields.append(feat)

        if unparseable_fields:
            penalty = len(unparseable_fields) * 15.0
            score -= penalty
            issues.append({
                "type": "TYPE_VALIDITY_ERROR",
                "severity": "HIGH",
                "penalty": penalty,
                "message": f"Non-numeric values found in expected numerical fields: {', '.join(unparseable_fields)}"
            })
        else:
            passed_checks.append("All provided fields successfully parsed.")

        # 3. Suspicious Defaults (Zeros where zero is biologically impossible)
        suspicious_zeros = []
        suspicious_zero_candidates = {
            "trestbps": "Resting Blood Pressure",
            "chol": "Serum Cholesterol",
            "thalach": "Heart Rate",
            "Glucose": "Blood Glucose",
            "BloodPressure": "Blood Pressure",
            "BMI": "Body Mass Index",
            "Total_Protiens": "Total Proteins",
            "Albumin": "Albumin"
        }
        for feat, label in suspicious_zero_candidates.items():
            if feat in parsed_data and parsed_data[feat] == 0.0:
                suspicious_zeros.append(label)

        if suspicious_zeros:
            penalty = len(suspicious_zeros) * 10.0
            score -= penalty
            issues.append({
                "type": "SUSPICIOUS_DEFAULT",
                "severity": "MEDIUM",
                "penalty": penalty,
                "message": f"Suspicious zero values recorded for vital parameters: {', '.join(suspicious_zeros)}"
            })
        else:
            passed_checks.append("No suspicious zero defaults detected.")

        # 4. Physiological Range Validity
        out_of_range = []
        for feat, spec in reference_ranges.items():
            if feat not in parsed_data:
                continue

            val = parsed_data[feat]
            min_val = spec.get("min", None)
            max_val = spec.get("max", None)
            allowed = spec.get("allowed", None)

            if allowed is not None and val not in allowed:
                out_of_range.append(f"{feat} = {val} (allowed: {allowed})")
            elif min_val is not None and val < min_val:
                out_of_range.append(f"{feat} = {val} < physiological min {min_val}")
            elif max_val is not None and val > max_val:
                out_of_range.append(f"{feat} = {val} > physiological max {max_val}")

        if out_of_range:
            penalty = min(30.0, len(out_of_range) * 8.0)
            score -= penalty
            issues.append({
                "type": "RANGE_VIOLATION",
                "severity": "MEDIUM",
                "penalty": penalty,
                "message": f"Values violate medical reference limits: {'; '.join(out_of_range)}"
            })
        else:
            passed_checks.append("All parameters within physiological plausibility limits.")

        # 5. Conflicting Clinical Values Check
        conflicts = []
        if disease_name == "liver":
            dir_bil = parsed_data.get("Direct_Bilirubin", 0.0)
            tot_bil = parsed_data.get("Total_Bilirubin", 0.0)
            if dir_bil > tot_bil and tot_bil > 0:
                conflicts.append("Direct Bilirubin cannot exceed Total Bilirubin.")

            alb = parsed_data.get("Albumin", 0.0)
            tot_prot = parsed_data.get("Total_Protiens", 0.0)
            if alb > tot_prot and tot_prot > 0:
                conflicts.append("Serum Albumin cannot exceed Total Serum Proteins.")

        elif disease_name == "parkinsons":
            fhi = parsed_data.get("MDVP:Fhi(Hz)", 0.0)
            flo = parsed_data.get("MDVP:Flo(Hz)", 0.0)
            if fhi > 0 and flo > 0 and fhi < flo:
                conflicts.append("Maximum vocal frequency (Fhi) cannot be lower than minimum vocal frequency (Flo).")

        elif disease_name == "heart":
            oldpeak = parsed_data.get("oldpeak", 0.0)
            if oldpeak < 0:
                conflicts.append("ST Depression (oldpeak) cannot be negative.")

        if conflicts:
            penalty = len(conflicts) * 25.0
            score -= penalty
            issues.append({
                "type": "CONFLICTING_VALUES",
                "severity": "CRITICAL",
                "penalty": penalty,
                "message": f"Biochemical contradiction: {'; '.join(conflicts)}"
            })
        else:
            passed_checks.append("No physiological contradictions detected.")

        # Final score clamping
        final_score = round(max(0.0, min(100.0, score)), 1)

        # Apply Quality Gate Rules
        if final_score < 60.0:
            action = "SUPPRESS"
            status_text = "Data quality unacceptable. Prediction suppressed until input corrected."
            badge_color = "red"
        elif final_score <= 80.0:
            action = "WARNING"
            status_text = "Moderate data quality issues detected. Review warnings before clinical decision."
            badge_color = "amber"
        else:
            action = "NORMAL"
            status_text = "Data quality verified. Suitable for reliable diagnostic inference."
            badge_color = "green"

        return {
            "disease": disease_name,
            "quality_score": final_score,
            "action": action,
            "badge_color": badge_color,
            "status_text": status_text,
            "issues": issues,
            "passed_checks": passed_checks
        }


def score_data_quality(disease_name: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience wrapper for scoring patient data quality."""
    auditor = DataQualityAuditor()
    return auditor.audit_record(disease_name, input_data)


if __name__ == "__main__":
    print("Testing data quality auditor...")
    # Test valid
    good_liver = {
        "Age": 45, "Gender": "Male", "Total_Bilirubin": 1.2, "Direct_Bilirubin": 0.4,
        "Alkaline_Phosphotase": 180, "Alamine_Aminotransferase": 35,
        "Aspartate_Aminotransferase": 40, "Total_Protiens": 7.0, "Albumin": 3.8,
        "Albumin_and_Globulin_Ratio": 1.1
    }
    res_good = score_data_quality("liver", good_liver)
    print("Good Liver Score:", res_good["quality_score"], res_good["action"])

    # Test conflicting
    bad_liver = dict(good_liver)
    bad_liver["Direct_Bilirubin"] = 5.0  # exceeds Total Bilirubin 1.2
    res_bad = score_data_quality("liver", bad_liver)
    print("Bad Liver Score:", res_bad["quality_score"], res_bad["action"], res_bad["issues"])
