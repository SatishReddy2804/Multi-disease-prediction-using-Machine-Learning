"""
Comprehensive tests for the ML pipeline modules.
Tests data ingestion, cleaning, feature engineering, model training,
inference, uncertainty, what-if simulation, cross-risk, and data quality.
"""

import sys
import pytest
import numpy as np
import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ml.src.data_ingestion import load_raw_dataset, load_config
from ml.src.data_cleaning import clean_dataset
from ml.src.feature_engineering import FeaturePipeline
from ml.src.inference import predict_disease
from ml.src.uncertainty import check_red_flags
from ml.src.data_quality import score_data_quality
from ml.src.what_if_simulator import run_what_if_simulation
from ml.src.cross_risk_engine import CrossRiskEngine


class TestDataIngestion:
    def test_load_heart_dataset(self):
        df = load_raw_dataset("heart")
        assert df is not None
        assert len(df) == 303
        assert len(df.columns) == 14

    def test_load_diabetes_dataset(self):
        df = load_raw_dataset("diabetes")
        assert df is not None
        assert len(df) == 768
        assert "Outcome" in df.columns

    def test_load_parkinsons_dataset(self):
        df = load_raw_dataset("parkinsons")
        assert df is not None
        assert len(df) == 195
        assert "status" in df.columns

    def test_load_liver_dataset(self):
        df = load_raw_dataset("liver")
        assert df is not None
        assert len(df) == 583

    def test_load_invalid_disease(self):
        with pytest.raises((ValueError, KeyError)):
            load_raw_dataset("unknown_disease")


class TestDataCleaning:
    def test_clean_heart_data(self):
        df = load_raw_dataset("heart")
        cleaned, _ = clean_dataset(df, "heart", is_train=True)
        assert cleaned is not None
        assert not cleaned.isnull().any().any()
        assert set(cleaned["target"].unique()).issubset({0, 1})

    def test_clean_diabetes_zeros(self):
        df = load_raw_dataset("diabetes")
        cleaned, _ = clean_dataset(df, "diabetes", is_train=True)
        assert (cleaned["Glucose"] == 0).sum() == 0

    def test_clean_liver_target_encoding(self):
        df = load_raw_dataset("liver")
        cleaned, _ = clean_dataset(df, "liver", is_train=True)
        assert set(cleaned["target"].unique()).issubset({0, 1})

    def test_clean_parkinsons_drops_name(self):
        df = load_raw_dataset("parkinsons")
        cleaned, _ = clean_dataset(df, "parkinsons", is_train=True)
        assert "name" not in cleaned.columns


class TestFeatureEngineering:
    def test_prepare_features(self):
        df = load_raw_dataset("heart")
        cleaned, _ = clean_dataset(df, "heart", is_train=True)
        pipeline = FeaturePipeline("heart")
        split_dict = pipeline.prepare_data(cleaned)
        assert "X_train_scaled" in split_dict
        assert "X_test_scaled" in split_dict
        assert len(split_dict["X_train_scaled"]) > 0


class TestInference:
    def test_predict_heart(self):
        sample = {
            "age": 55, "sex": 1, "cp": 3, "trestbps": 140,
            "chol": 250, "fbs": 0, "restecg": 0, "thalach": 150,
            "exang": 0, "oldpeak": 1.5, "slope": 2, "ca": 0, "thal": 3
        }
        res = predict_disease("heart", sample)
        assert res["prediction"] in [0, 1]
        assert 0.0 <= res["probability"] <= 1.0
        assert res["risk_level"] in ["Low", "Moderate", "High", "Critical"]

    def test_predict_diabetes(self):
        sample = {
            "Pregnancies": 2, "Glucose": 120, "BloodPressure": 70,
            "SkinThickness": 20, "Insulin": 80, "BMI": 25.0,
            "DiabetesPedigreeFunction": 0.4, "Age": 33
        }
        res = predict_disease("diabetes", sample)
        assert res["prediction"] in [0, 1]
        assert 0.0 <= res["probability"] <= 1.0


class TestUncertainty:
    def test_check_red_flags(self):
        critical_sample = {
            "age": 60, "sex": 1, "cp": 4, "trestbps": 195,
            "chol": 250, "fbs": 0, "restecg": 0, "thalach": 150,
            "exang": 0, "oldpeak": 1.5, "slope": 2, "ca": 0, "thal": 3
        }
        flags = check_red_flags("heart", critical_sample)
        assert len(flags) > 0


class TestDataQuality:
    def test_quality_score_complete(self):
        sample = {
            "age": 55, "sex": 1, "cp": 3, "trestbps": 140,
            "chol": 250, "fbs": 0, "restecg": 0, "thalach": 150,
            "exang": 0, "oldpeak": 1.5, "slope": 2, "ca": 0, "thal": 3
        }
        result = score_data_quality("heart", sample)
        assert "quality_score" in result
        assert 0 <= result["quality_score"] <= 100
        assert result["action"] in ["NORMAL", "WARNING", "SUPPRESS"]


class TestWhatIfSimulator:
    def test_what_if_simulation(self):
        original = {
            "Pregnancies": 4, "Glucose": 160, "BloodPressure": 80,
            "SkinThickness": 30, "Insulin": 150, "BMI": 33.0,
            "DiabetesPedigreeFunction": 0.5, "Age": 45
        }
        mods = {"Glucose": 110, "BMI": 26.0}
        sim = run_what_if_simulation("diabetes", original, mods)
        assert "baseline" in sim
        assert "counterfactual" in sim
        assert "overall_impact" in sim
        assert "ranked_interventions" in sim
        assert len(sim["ranked_interventions"]) > 0


class TestCrossRiskEngine:
    def test_cross_risk_analysis(self):
        engine = CrossRiskEngine()
        predictions = {
            "heart": {"probability": 0.75, "risk_level": "High"},
            "diabetes": {"probability": 0.70, "risk_level": "High"},
        }
        result = engine.analyze(predictions)
        assert "detected_clusters" in result
        assert "overall_priority" in result
        assert result["overall_priority"] == "HIGH"
        assert len(result["detected_clusters"]) > 0
