"""
Inference Module for Multi-Disease Prediction System.

Implements a thread-safe Singleton model cache, handles feature validation,
executes probabilistic inference with calibrated thresholds, and assigns clinical risk levels.
"""

import os
import threading
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Union, List, Tuple
import joblib
import numpy as np
import pandas as pd

from ml.src.data_ingestion import load_config
from ml.src.data_cleaning import DataCleaner

logger = logging.getLogger(__name__)


def map_risk_level(probability: float) -> str:
    """
    Map disease probability to clinical risk level category.

    Args:
        probability: Float between 0.0 and 1.0.

    Returns:
        Risk level string: 'Low', 'Moderate', 'High', or 'Critical'.
    """
    if probability >= 0.75:
        return "Critical"
    elif probability >= 0.50:
        return "High"
    elif probability >= 0.25:
        return "Moderate"
    else:
        return "Low"


class ModelRegistry:
    """
    Thread-safe Singleton cache managing trained model artifacts in memory.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(ModelRegistry, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        if getattr(self, "_initialized", False):
            return

        self.config = config if config is not None else load_config()
        self.models_dir = Path(
            self.config.get("paths", {}).get(
                "models_dir",
                "d:/AI based disease prediction using ml/multi_disease_prediction_system/ml/models"
            )
        )
        self._bundles: Dict[str, Dict[str, Any]] = {}
        self._initialized = True
        logger.info("ModelRegistry initialized. Models directory: %s", self.models_dir)

    def get_bundle(self, disease_name: str) -> Dict[str, Any]:
        """
        Retrieve or lazily load the model bundle for the specified disease.

        Args:
            disease_name: Target disease name.

        Returns:
            Dictionary containing model, scaler, cleaner, and metadata.
        """
        disease_name = disease_name.lower().strip()
        if disease_name in self._bundles:
            return self._bundles[disease_name]

        with self._lock:
            if disease_name in self._bundles:
                return self._bundles[disease_name]

            bundle_path = self.models_dir / f"{disease_name}_model_bundle.joblib"
            if not bundle_path.exists():
                raise FileNotFoundError(
                    f"Model bundle for '{disease_name}' not found at {bundle_path}. "
                    f"Please run the training pipeline first: python -m ml.src.train_models --disease {disease_name}"
                )

            logger.info("Loading model bundle for '%s' into memory cache...", disease_name)
            bundle = joblib.load(bundle_path)
            self._bundles[disease_name] = bundle
            return bundle

    def clear_cache(self, disease_name: Optional[str] = None) -> None:
        """Clear cached models for one or all diseases."""
        with self._lock:
            if disease_name:
                self._bundles.pop(disease_name.lower().strip(), None)
            else:
                self._bundles.clear()
        logger.info("ModelRegistry cache cleared (%s).", disease_name or "all")


class InferenceEngine:
    """
    High-level inference service for patient risk scoring.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config if config is not None else load_config()
        self.registry = ModelRegistry(self.config)

    def prepare_input_array(
        self,
        disease_name: str,
        input_data: Union[Dict[str, Any], pd.DataFrame]
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Convert patient input to ordered, cleaned, and scaled feature vector.

        Args:
            disease_name: Disease identifier.
            input_data: Dict or single-row DataFrame.

        Returns:
            Tuple of (scaled 2D numpy array, raw input dictionary).
        """
        bundle = self.registry.get_bundle(disease_name)
        feature_names = bundle["feature_names"]
        cleaner: DataCleaner = bundle["cleaner"]
        scaler = bundle["scaler"]

        if isinstance(input_data, dict):
            raw_dict = dict(input_data)
            df = pd.DataFrame([raw_dict])
        elif isinstance(input_data, pd.DataFrame):
            df = input_data.copy()
            raw_dict = df.iloc[0].to_dict()
        else:
            raise TypeError("input_data must be a dict or pandas DataFrame")

        # Ensure all required features are present (fill with cleaner defaults if missing)
        for feat in feature_names:
            if feat not in df.columns:
                default_val = cleaner.numeric_imputations.get(feat, cleaner.categorical_imputations.get(feat, 0.0))
                df[feat] = default_val
                raw_dict[feat] = default_val

        # Transform with cleaner (do not drop duplicates for single inference)
        cleaned_df = cleaner.transform(df, drop_duplicates=False)

        # Select only model features in order
        ordered_features = cleaned_df[feature_names].astype(float).values

        # Scale features
        scaled_array = scaler.transform(ordered_features)
        return scaled_array, raw_dict

    def predict(
        self,
        disease_name: str,
        input_data: Union[Dict[str, Any], pd.DataFrame]
    ) -> Dict[str, Any]:
        """
        Perform disease prediction for a single patient record.

        Args:
            disease_name: Disease name ('heart', 'diabetes', 'parkinsons', 'liver').
            input_data: Feature key-value dictionary or DataFrame.

        Returns:
            Dictionary containing prediction outcome, probability, and risk level.
        """
        disease_name = disease_name.lower().strip()
        bundle = self.registry.get_bundle(disease_name)
        best_model = bundle["best_model"]
        best_model_name = bundle["best_model_name"]

        scaled_vector, raw_dict = self.prepare_input_array(disease_name, input_data)

        # Predict probability
        if hasattr(best_model, "predict_proba"):
            probabilities = best_model.predict_proba(scaled_vector)[0]
            prob_disease = float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0])
        else:
            prob_disease = float(best_model.predict(scaled_vector)[0])

        pred_class = 1 if prob_disease >= 0.50 else 0
        risk_level = map_risk_level(prob_disease)

        return {
            "disease": disease_name,
            "prediction": pred_class,
            "probability": round(prob_disease, 4),
            "risk_percentage": round(prob_disease * 100, 1),
            "risk_level": risk_level,
            "model_name": best_model_name,
            "raw_inputs": raw_dict,
            "timestamp": datetime.utcnow().isoformat()
        }


# Global inference instance
_default_engine = None


def get_inference_engine(config: Optional[Dict[str, Any]] = None) -> InferenceEngine:
    """Get or instantiate default global InferenceEngine."""
    global _default_engine
    if _default_engine is None:
        _default_engine = InferenceEngine(config=config)
    return _default_engine


def predict_disease(disease_name: str, input_data: Union[Dict[str, Any], pd.DataFrame]) -> Dict[str, Any]:
    """Convenience helper for quick disease prediction."""
    engine = get_inference_engine()
    return engine.predict(disease_name, input_data)


if __name__ == "__main__":
    print("Testing inference module...")
    # Example input for heart disease
    heart_sample = {
        "age": 55, "sex": 1, "cp": 3, "trestbps": 140, "chol": 240,
        "fbs": 0, "restecg": 1, "thalach": 150, "exang": 0, "oldpeak": 1.2,
        "slope": 2, "ca": 0, "thal": 3
    }
    try:
        res = predict_disease("heart", heart_sample)
        print("Inference result:", res)
    except FileNotFoundError as err:
        print("Model bundle not yet generated (expected if train_models not run yet):", err)
