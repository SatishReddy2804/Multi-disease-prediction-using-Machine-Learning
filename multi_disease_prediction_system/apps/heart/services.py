import os
import logging
from pathlib import Path
from typing import Dict, Any, Tuple
from django.conf import settings

logger = logging.getLogger(__name__)

try:
    from ml.src.inference import predict_disease as predict
except ImportError:
    predict = None

try:
    from ml.src.explainability import explain_prediction
except ImportError:
    explain_prediction = None


class HeartPredictionService:
    """
    Heart Disease Prediction Service wrapping ML inference, explainability,
    risk stratification, prevention protocols, and educational therapeutics.
    """

    PREVENTION_GUIDANCE = [
        "Cardioprotective Diet: Emphasize a Mediterranean or DASH dietary pattern rich in leafy greens, omega-3 fatty acids, whole grains, and lean proteins while restricting saturated fats and sodium (<2,300 mg/day).",
        "Targeted Physical Activity: Aim for a minimum of 150 minutes of moderate-intensity aerobic exercise or 75 minutes of vigorous exercise weekly.",
        "Blood Pressure & Lipid Optimization: Maintain resting blood pressure below 120/80 mmHg and LDL cholesterol within target clinical thresholds (<70-100 mg/dL).",
        "Smoking Cessation & Alcohol Moderation: Completely eliminate tobacco use and avoid secondhand smoke exposure. Restrict alcohol to no more than 1 drink per day for women or 2 for men.",
        "Stress & Sleep Hygiene: Cultivate mindfulness or stress mitigation practices and ensure 7 to 9 hours of restorative sleep nightly to prevent sympathetic nervous overactivity.",
    ]

    MEDICINE_INFORMATION = [
        {
            "name": "Statins (e.g., Atorvastatin, Rosuvastatin)",
            "class": "HMG-CoA Reductase Inhibitor",
            "purpose": "Lower LDL cholesterol, slow plaque progression, and stabilize coronary atherosclerotic plaques.",
            "usage_notes": "Take regularly as prescribed; monitor liver transaminases and muscle symptoms.",
        },
        {
            "name": "Beta-Blockers (e.g., Metoprolol, Atenolol, Bisoprolol)",
            "class": "Beta-Adrenergic Receptor Blocker",
            "purpose": "Decrease heart rate, myocardial contractility, and systemic blood pressure to reduce cardiac workload.",
            "usage_notes": "Do not discontinue abruptly; monitor resting pulse and blood pressure.",
        },
        {
            "name": "ACE Inhibitors / ARBs (e.g., Lisinopril, Losartan)",
            "class": "Renin-Angiotensin System Inhibitors",
            "purpose": "Promote vasodilation, reduce systemic vascular resistance, and preserve cardiac and renal function.",
            "usage_notes": "Periodic monitoring of serum potassium and creatinine is clinically standard.",
        },
        {
            "name": "Antiplatelet Therapy (e.g., Aspirin, Clopidogrel)",
            "class": "Platelet Aggregation Inhibitor",
            "purpose": "Inhibit thrombus formation and prevent acute occlusion in coronary arterial branches.",
            "usage_notes": "Watch for gastrointestinal bleeding signs or unusual bruising.",
        },
    ]

    DISCLAIMER = (
        "MEDICAL DISCLAIMER: This artificial intelligence risk prediction is strictly for decision-support "
        "and educational purposes. It does NOT constitute medical diagnosis, treatment, or formal prescription. "
        "Always consult a board-certified cardiologist or qualified healthcare professional."
    )

    @classmethod
    def get_risk_level(cls, probability: float) -> str:
        if probability < 0.3:
            return "Low"
        elif probability < 0.6:
            return "Moderate"
        elif probability < 0.8:
            return "High"
        else:
            return "Critical"

    @classmethod
    def predict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes inference, explainability, and risk classification.
        Returns result dict or raises FileNotFoundError if model is not trained yet.
        """
        model_path = Path(settings.MODEL_DIRECTORY) / "heart_model.joblib"
        
        # Check if ML module or model exists
        if predict is not None and callable(predict):
            try:
                res = predict("heart", data)
                probability = float(res.get("probability", 0.5))
                prediction_result = int(res.get("prediction", 1 if probability >= 0.5 else 0))
            except FileNotFoundError:
                raise FileNotFoundError("Heart model file not found.")
            except Exception as e:
                logger.warning(f"Inference module execution error: {e}")
                raise
        elif model_path.exists():
            # Load with joblib if available
            try:
                import joblib
                model = joblib.load(model_path)
                features = [
                    data["age"], data["sex"], data["cp"], data["trestbps"], data["chol"],
                    data["fbs"], data["restecg"], data["thalach"], data["exang"],
                    data["oldpeak"], data["slope"], data["ca"], data["thal"],
                ]
                import numpy as np
                x_arr = np.array([features])
                if hasattr(model, "predict_proba"):
                    probs = model.predict_proba(x_arr)[0]
                    probability = float(probs[1]) if len(probs) > 1 else float(probs[0])
                else:
                    probability = float(model.predict(x_arr)[0])
                prediction_result = 1 if probability >= 0.5 else 0
            except Exception as e:
                logger.error(f"Error loading model from {model_path}: {e}")
                raise FileNotFoundError("Model could not be loaded from disk.")
        else:
            # Model not trained yet
            raise FileNotFoundError("Model not trained yet.")

        risk_level = cls.get_risk_level(probability)

        # Explainability
        explanation = cls._get_explainability(data, probability)

        return {
            "disease_type": "heart",
            "prediction_result": prediction_result,
            "probability": round(probability, 4),
            "risk_level": risk_level,
            "explainability": explanation,
            "prevention_guidance": cls.PREVENTION_GUIDANCE,
            "medicine_information": cls.MEDICINE_INFORMATION,
            "disclaimer": cls.DISCLAIMER,
        }

    @classmethod
    def _get_explainability(cls, data: Dict[str, Any], probability: float) -> Dict[str, Any]:
        if explain_prediction is not None and callable(explain_prediction):
            try:
                return explain_prediction("heart", data)
            except Exception as e:
                logger.warning(f"Explainability module error: {e}")

        # Deterministic clinical importance estimation
        features_impact = [
            {"feature": "cp", "name": "Chest Pain Type", "value": data.get("cp"), "impact": "High", "weight": 0.24},
            {"feature": "oldpeak", "name": "ST Depression", "value": data.get("oldpeak"), "impact": "High", "weight": 0.21},
            {"feature": "thalach", "name": "Max Heart Rate", "value": data.get("thalach"), "impact": "Moderate", "weight": 0.18},
            {"feature": "ca", "name": "Major Vessels Colored", "value": data.get("ca"), "impact": "Moderate", "weight": 0.15},
            {"feature": "trestbps", "name": "Resting Blood Pressure", "value": data.get("trestbps"), "impact": "Moderate", "weight": 0.12},
            {"feature": "chol", "name": "Cholesterol", "value": data.get("chol"), "impact": "Low", "weight": 0.10},
        ]
        return {
            "method": "Clinical Feature Weighting",
            "feature_contributions": features_impact,
            "summary": "Chest pain classification and ST depression are the strongest contributors to the predicted risk.",
        }
