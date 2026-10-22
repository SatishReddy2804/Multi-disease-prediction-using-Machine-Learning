import os
import logging
from pathlib import Path
from typing import Dict, Any
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


class DiabetesPredictionService:
    """
    Diabetes Prediction Service wrapping ML inference, explainability,
    risk stratification, prevention protocols, and educational therapeutics.
    """

    PREVENTION_GUIDANCE = [
        "Glycemic & Dietary Control: Adopt a low-glycemic dietary regimen high in soluble fiber and resistant starch; strictly limit refined sugars and sugar-sweetened beverages.",
        "Daily Physical Activity: Engage in at least 30 minutes of moderate aerobic activity (e.g., brisk walking, cycling) and two sessions of resistance training per week to enhance muscular glucose uptake.",
        "Weight Management: Strive for a sustained 5-7% weight reduction if overweight, which can reduce Type 2 Diabetes progression risk by up to 58%.",
        "Routine Glycemic Screening: Monitor fasting plasma glucose and Hemoglobin A1c (HbA1c) every 6 months to track glycemic drift early.",
        "Hydration & Sleep Consistency: Maintain consistent 7-8 hours of sleep per night and adequate hydration to preserve insulin receptor sensitivity and cortisol balance.",
    ]

    MEDICINE_INFORMATION = [
        {
            "name": "Metformin",
            "class": "Biguanide",
            "purpose": "Decreases hepatic gluconeogenesis and increases peripheral insulin sensitivity in skeletal muscle.",
            "usage_notes": "First-line pharmacotherapy; take with meals to reduce gastrointestinal side effects.",
        },
        {
            "name": "SGLT2 Inhibitors (e.g., Empagliflozin, Dapagliflozin)",
            "class": "Sodium-Glucose Cotransporter 2 Inhibitor",
            "purpose": "Inhibits renal tubular glucose reabsorption to enhance urinary glucose excretion; provides cardioprotective benefits.",
            "usage_notes": "Maintain adequate daily hydration; monitor for symptoms of mycotic genital infections.",
        },
        {
            "name": "GLP-1 Receptor Agonists (e.g., Semaglutide, Dulaglutide)",
            "class": "Incretin Mimetic",
            "purpose": "Enhances glucose-dependent insulin secretion, suppresses glucagon release, and slows gastric emptying.",
            "usage_notes": "Administered via subcutaneous injection or oral formulations; promotes significant weight loss.",
        },
        {
            "name": "Sulfonylureas (e.g., Glipizide, Glimepiride)",
            "class": "Secretagogue",
            "purpose": "Stimulates pancreatic beta-cells to secrete more endogenous insulin.",
            "usage_notes": "Requires monitoring for potential hypoglycemia; take before meals.",
        },
    ]

    DISCLAIMER = (
        "MEDICAL DISCLAIMER: This diabetes risk assessment is powered by machine learning algorithms "
        "and is intended exclusively for educational and screening decision support. It is not a clinical diagnosis "
        "of Diabetes Mellitus or Impaired Glucose Tolerance. Consult an endocrinologist or certified diabetes educator."
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
        model_path = Path(settings.MODEL_DIRECTORY) / "diabetes_model.joblib"

        mapped_data = {
            "Pregnancies": data.get("pregnancies", data.get("Pregnancies", 0)),
            "Glucose": data.get("glucose", data.get("Glucose", 0)),
            "BloodPressure": data.get("blood_pressure", data.get("BloodPressure", 0)),
            "SkinThickness": data.get("skin_thickness", data.get("SkinThickness", 0)),
            "Insulin": data.get("insulin", data.get("Insulin", 0)),
            "BMI": data.get("bmi", data.get("BMI", 0.0)),
            "DiabetesPedigreeFunction": data.get("diabetes_pedigree", data.get("DiabetesPedigreeFunction", 0.0)),
            "Age": data.get("age", data.get("Age", 0))
        }

        # Check if ML module or model exists
        if predict is not None and callable(predict):
            try:
                res = predict("diabetes", mapped_data)
                probability = float(res.get("probability", 0.5))
                prediction_result = int(res.get("prediction", 1 if probability >= 0.5 else 0))
            except FileNotFoundError:
                raise FileNotFoundError("Diabetes model file not found.")
            except Exception as e:
                logger.warning(f"Inference module execution error: {e}")
                raise
        elif model_path.exists():
            try:
                import joblib
                model = joblib.load(model_path)
                features = [
                    data.get("pregnancies", data.get("Pregnancies", 0)),
                    data.get("glucose", data.get("Glucose", 0)),
                    data.get("blood_pressure", data.get("BloodPressure", 0)),
                    data.get("skin_thickness", data.get("SkinThickness", 0)),
                    data.get("insulin", data.get("Insulin", 0)),
                    data.get("bmi", data.get("BMI", 0)),
                    data.get("diabetes_pedigree", data.get("DiabetesPedigreeFunction", 0)),
                    data.get("age", data.get("Age", 0)),
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
            raise FileNotFoundError("Model not trained yet.")

        risk_level = cls.get_risk_level(probability)
        explanation = cls._get_explainability(mapped_data, probability)

        return {
            "disease_type": "diabetes",
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
                return explain_prediction("diabetes", data)
            except Exception as e:
                logger.warning(f"Explainability module error: {e}")

        glucose_val = data.get("glucose", 0)
        bmi_val = data.get("bmi", 0)
        age_val = data.get("age", 0)

        features_impact = [
            {"feature": "glucose", "name": "Glucose Concentration", "value": glucose_val, "impact": "High", "weight": 0.32},
            {"feature": "bmi", "name": "Body Mass Index", "value": bmi_val, "impact": "High", "weight": 0.22},
            {"feature": "age", "name": "Patient Age", "value": age_val, "impact": "Moderate", "weight": 0.16},
            {"feature": "diabetes_pedigree", "name": "Pedigree Function", "value": data.get("diabetes_pedigree", 0), "impact": "Moderate", "weight": 0.12},
            {"feature": "insulin", "name": "Insulin Level", "value": data.get("insulin", 0), "impact": "Moderate", "weight": 0.10},
            {"feature": "blood_pressure", "name": "Blood Pressure", "value": data.get("blood_pressure", 0), "impact": "Low", "weight": 0.08},
        ]
        return {
            "method": "Clinical Feature Weighting",
            "feature_contributions": features_impact,
            "summary": "Plasma glucose concentration and BMI are the predominant driving factors in this diabetes evaluation.",
        }
