"""
Multi-Disease Prediction System ML Pipeline Package.
"""

from ml.src.data_ingestion import load_config, load_raw_dataset, load_all_raw_datasets
from ml.src.data_cleaning import DataCleaner, clean_dataset
from ml.src.feature_engineering import FeaturePipeline
from ml.src.inference import ModelRegistry, InferenceEngine, predict_disease
from ml.src.uncertainty import UncertaintyEstimator, check_red_flags
from ml.src.explainability import DiseaseExplainer
from ml.src.what_if_simulator import WhatIfSimulator, run_what_if_simulation
from ml.src.data_quality import DataQualityAuditor, score_data_quality
from ml.src.report_generator import ClinicalReportGenerator, generate_pdf_report

__version__ = "1.0.0"

__all__ = [
    "load_config",
    "load_raw_dataset",
    "load_all_raw_datasets",
    "DataCleaner",
    "clean_dataset",
    "FeaturePipeline",
    "ModelRegistry",
    "InferenceEngine",
    "predict_disease",
    "UncertaintyEstimator",
    "check_red_flags",
    "DiseaseExplainer",
    "WhatIfSimulator",
    "run_what_if_simulation",
    "DataQualityAuditor",
    "score_data_quality",
    "ClinicalReportGenerator",
    "generate_pdf_report",
]
