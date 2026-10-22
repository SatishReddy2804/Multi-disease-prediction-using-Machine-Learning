import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)

# Graceful import of ML pipeline module
try:
    from ml.src.data_quality import assess_data_quality
except ImportError:
    assess_data_quality = None


class DataQualityService:
    """
    Validates clinical biometric inputs against physiological ranges,
    detects anomalies, zero-as-missing values, and scores overall data quality (0-100).
    """

    PHYSIOLOGICAL_RANGES = {
        "heart": {
            "age": (1, 120, "Age"),
            "trestbps": (60, 250, "Resting Blood Pressure"),
            "chol": (80, 600, "Serum Cholesterol"),
            "thalach": (50, 240, "Maximum Heart Rate"),
            "oldpeak": (0.0, 10.0, "ST Depression"),
            "cp": (1, 4, "Chest Pain Type"),
            "slope": (1, 3, "ST Slope"),
            "ca": (0, 3, "Major Vessels"),
        },
        "diabetes": {
            "pregnancies": (0, 20, "Pregnancies"),
            "glucose": (40, 350, "Glucose Concentration"),
            "blood_pressure": (40, 220, "Diastolic Blood Pressure"),
            "skin_thickness": (5, 99, "Triceps Skinfold Thickness"),
            "insulin": (2, 900, "2-Hour Serum Insulin"),
            "bmi": (12.0, 80.0, "Body Mass Index"),
            "diabetes_pedigree": (0.05, 3.0, "Diabetes Pedigree Function"),
            "age": (1, 120, "Age"),
        },
        "liver": {
            "age": (1, 120, "Age"),
            "total_bilirubin": (0.1, 100.0, "Total Bilirubin"),
            "direct_bilirubin": (0.05, 30.0, "Direct Bilirubin"),
            "alkaline_phosphotase": (20, 3000, "Alkaline Phosphotase"),
            "alamine_aminotransferase": (5, 3000, "ALT (Alamine Aminotransferase)"),
            "aspartate_aminotransferase": (5, 5000, "AST (Aspartate Aminotransferase)"),
            "total_protiens": (2.0, 15.0, "Total Proteins"),
            "albumin": (1.0, 10.0, "Albumin"),
            "albumin_globulin_ratio": (0.1, 5.0, "Albumin and Globulin Ratio"),
        },
        "parkinsons": {
            "mdvp_fo": (50.0, 300.0, "Fundamental Frequency Fo"),
            "mdvp_fhi": (50.0, 600.0, "Highest Vocal Frequency Fhi"),
            "mdvp_flo": (30.0, 300.0, "Lowest Vocal Frequency Flo"),
            "hnr": (0.0, 45.0, "Harmonics-to-Noise Ratio"),
            "nhr": (0.0, 1.0, "Noise-to-Harmonics Ratio"),
            "rpde": (0.0, 1.0, "Recurrence Period Density Entropy"),
            "dfa": (0.0, 2.0, "Detrended Fluctuation Analysis"),
        },
    }

    # Features where zero is physiologically invalid and indicates missing/corrupted test data
    ZERO_AS_MISSING = {
        "diabetes": ["glucose", "blood_pressure", "skin_thickness", "insulin", "bmi"],
        "heart": ["trestbps", "chol", "thalach"],
        "liver": ["total_bilirubin", "alkaline_phosphotase", "alamine_aminotransferase", "total_protiens", "albumin"],
        "parkinsons": ["mdvp_fo", "mdvp_fhi", "mdvp_flo"],
    }

    @classmethod
    def check(cls, disease_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs comprehensive data quality assessment.
        """
        d_type = str(disease_type).lower().strip()
        if d_type == "parkinson":
            d_type = "parkinsons"

        if assess_data_quality is not None and callable(assess_data_quality):
            try:
                ml_quality = assess_data_quality(disease_type=d_type, data=input_data)
                if isinstance(ml_quality, dict):
                    return ml_quality
            except Exception as e:
                logger.warning(f"Error calling ml.src.data_quality: {e}. Falling back to internal checks.")

        return cls._internal_check(d_type, input_data)

    @classmethod
    def _internal_check(cls, disease_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        ranges = cls.PHYSIOLOGICAL_RANGES.get(disease_type, {})
        zero_missing_keys = cls.ZERO_AS_MISSING.get(disease_type, [])

        warnings: List[str] = []
        errors: List[str] = []
        feature_checks: Dict[str, Any] = {}

        total_tested = 0
        penalties = 0.0

        # Standardize keys to lowercase for checking
        normalized_data = {str(k).lower().replace(":", "_").replace("(", "_").replace(")", "").replace("%", "percent"): v for k, v in data.items()}

        for key, (min_val, max_val, label) in ranges.items():
            # Check presence
            val = None
            if key in normalized_data:
                val = normalized_data[key]
            else:
                # try finding partial match
                for d_k, d_v in normalized_data.items():
                    if key in d_k or d_k in key:
                        val = d_v
                        break

            if val is None:
                penalties += 10.0
                warnings.append(f"Field '{label}' is missing from patient inputs.")
                feature_checks[key] = {"status": "missing", "value": None}
                continue

            try:
                num_val = float(val)
                total_tested += 1

                # Check impossible zero
                if num_val == 0.0 and key in zero_missing_keys:
                    penalties += 15.0
                    warnings.append(f"{label} is recorded as 0, which is physiologically implausible for living subjects (likely unmeasured).")
                    feature_checks[key] = {
                        "status": "zero_imputed",
                        "value": num_val,
                        "valid": False,
                    }
                    continue

                # Check range bounds
                if num_val < min_val or num_val > max_val:
                    penalties += 12.0
                    warnings.append(f"{label} ({num_val}) lies outside expected physiological range [{min_val}, {max_val}].")
                    feature_checks[key] = {
                        "status": "out_of_bounds",
                        "value": num_val,
                        "expected": [min_val, max_val],
                        "valid": False,
                    }
                else:
                    feature_checks[key] = {
                        "status": "valid",
                        "value": num_val,
                        "valid": True,
                    }
            except (ValueError, TypeError):
                penalties += 15.0
                errors.append(f"Invalid non-numerical format for {label}: '{val}'.")
                feature_checks[key] = {"status": "invalid_type", "value": val, "valid": False}

        # Calculate final quality score (0 to 100)
        quality_score = max(0.0, min(100.0, 100.0 - penalties))
        quality_score = round(quality_score, 1)

        is_valid = quality_score >= 60.0 and len(errors) == 0

        rating = "Excellent"
        if quality_score < 60:
            rating = "Degraded / Unreliable"
        elif quality_score < 75:
            rating = "Suboptimal"
        elif quality_score < 90:
            rating = "Acceptable"

        return {
            "disease_type": disease_type,
            "quality_score": quality_score,
            "rating": rating,
            "is_valid": is_valid,
            "warnings": warnings,
            "errors": errors,
            "feature_checks": feature_checks,
        }
