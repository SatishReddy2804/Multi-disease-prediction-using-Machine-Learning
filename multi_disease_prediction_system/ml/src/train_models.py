"""
Model Training Module for Multi-Disease Prediction System.

Trains all 7 model families (RandomForest, XGBoost, LogisticRegression,
SVM, KNN, DecisionTree, NaiveBayes) for each disease using Stratified 5-Fold
Cross-Validation and hyperparameter optimization via GridSearchCV.
Saves the best model, feature scaler, cleaner, and full model suite via joblib.
"""

import os
import argparse
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from xgboost import XGBClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
)

from ml.src.data_ingestion import load_raw_dataset, load_config, get_project_root
from ml.src.data_cleaning import clean_dataset
from ml.src.feature_engineering import FeaturePipeline

logger = logging.getLogger(__name__)


def get_base_estimators() -> Dict[str, Any]:
    """Return dictionary of base estimator classes and default instances."""
    return {
        "RandomForest": RandomForestClassifier(random_state=42),
        "XGBoost": XGBClassifier(random_state=42, eval_metric="logloss"),
        "LogisticRegression": LogisticRegression(random_state=42, max_iter=1000),
        "SVM": SVC(probability=True, random_state=42),
        "KNN": KNeighborsClassifier(),
        "DecisionTree": DecisionTreeClassifier(random_state=42),
        "NaiveBayes": GaussianNB()
    }


def train_single_model(
    model_name: str,
    base_estimator: Any,
    param_grid: Dict[str, List[Any]],
    X_train: np.ndarray,
    y_train: np.ndarray,
    cv_folds: int = 5,
    random_state: int = 42
) -> Tuple[Any, Dict[str, Any], float]:
    """
    Train and tune a single model family using Stratified 5-Fold GridSearchCV.

    Args:
        model_name: Name of model algorithm.
        base_estimator: Untrained estimator instance.
        param_grid: Grid of hyperparameters.
        X_train: Training features array.
        y_train: Training target array.
        cv_folds: Number of CV folds.
        random_state: Random state seed.

    Returns:
        Tuple of (fitted best estimator, best params dict, best CV score).
    """
    logger.info("Starting GridSearchCV optimization for '%s'...", model_name)
    skf = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=random_state)

    grid_search = GridSearchCV(
        estimator=base_estimator,
        param_grid=param_grid,
        scoring="roc_auc",
        cv=skf,
        n_jobs=-1,
        refit=True,
        error_score="raise"
    )

    try:
        grid_search.fit(X_train, y_train)
        best_estimator = grid_search.best_estimator_
        best_params = grid_search.best_params_
        best_score = float(grid_search.best_score_)
        logger.info(
            "Completed tuning for '%s': Best CV ROC-AUC = %.4f | Best Params: %s",
            model_name, best_score, best_params
        )
        return best_estimator, best_params, best_score
    except Exception as e:
        logger.warning(
            "GridSearchCV failed for '%s' with error: %s. Falling back to default fit.",
            model_name, str(e)
        )
        base_estimator.fit(X_train, y_train)
        return base_estimator, {}, 0.0


def evaluate_model_on_test(
    model: Any,
    X_test: np.ndarray,
    y_test: np.ndarray
) -> Dict[str, float]:
    """
    Compute comprehensive test metrics for a trained model.

    Args:
        model: Trained classifier.
        X_test: Test features array.
        y_test: Test ground truth array.

    Returns:
        Dictionary containing accuracy, precision, recall, f1, and roc_auc.
    """
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else y_pred.astype(float)

    accuracy = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    try:
        auc = float(roc_auc_score(y_test, y_proba))
    except Exception:
        auc = float(accuracy)

    return {
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "roc_auc": round(auc, 4)
    }


def train_disease_pipeline(
    disease_name: str,
    config: Optional[Dict[str, Any]] = None,
    save_artifacts: bool = True
) -> Dict[str, Any]:
    """
    Execute full training lifecycle for a disease:
    Data ingestion -> Data cleaning -> Feature scaling & SMOTE ->
    GridSearch on 7 model algorithms -> Best model selection -> Joblib artifact persistence.

    Args:
        disease_name: Disease identifier ('heart', 'diabetes', 'parkinsons', 'liver').
        config: Configuration dictionary.
        save_artifacts: Whether to serialize trained artifacts to disk.

    Returns:
        Dictionary containing trained models, best model, evaluation metrics, and transformers.
    """
    if config is None:
        config = load_config()

    disease_name = disease_name.lower().strip()
    logger.info("==================================================")
    logger.info("Initiating Training Pipeline for Disease: [%s]", disease_name.upper())
    logger.info("==================================================")

    # 1. Ingestion
    raw_df = load_raw_dataset(disease_name, config)

    # 2. Cleaning
    cleaned_df, cleaner = clean_dataset(raw_df, disease_name, config, is_train=True)

    # 3. Feature Pipeline
    pipeline = FeaturePipeline(disease_name, config)
    prep_data = pipeline.prepare_data(cleaned_df, apply_smote=True)

    X_train = prep_data["X_train_resampled"]
    y_train = prep_data["y_train_resampled"]
    X_test = prep_data["X_test_scaled"]
    y_test = prep_data["y_test"]
    scaler = prep_data["scaler"]
    feature_names = prep_data["feature_names"]

    # 4. Train Isolation Forest for Anomaly / Out-of-Distribution Detection
    isolation_forest = IsolationForest(
        contamination=0.05,
        random_state=42,
        n_estimators=100
    )
    isolation_forest.fit(prep_data["X_train_scaled"])

    # 5. Train all 7 Model Types
    base_estimators = get_base_estimators()
    grids_cfg = config.get("model_grids", {})
    cv_folds = int(config.get("project", {}).get("cv_folds", 5))

    trained_models: Dict[str, Any] = {}
    model_test_metrics: Dict[str, Dict[str, float]] = {}
    best_model_name: Optional[str] = None
    best_score: float = -1.0

    for model_name, estimator in base_estimators.items():
        param_grid = grids_cfg.get(model_name, {}).get("param_grid", {})
        fitted_model, best_params, cv_score = train_single_model(
            model_name=model_name,
            base_estimator=estimator,
            param_grid=param_grid,
            X_train=X_train,
            y_train=y_train,
            cv_folds=cv_folds
        )
        trained_models[model_name] = fitted_model

        # Evaluate on held-out test set
        metrics = evaluate_model_on_test(fitted_model, X_test, y_test)
        metrics["cv_roc_auc"] = round(cv_score, 4)
        model_test_metrics[model_name] = metrics

        logger.info(
            "[%s] Model '%s' Test Metrics -> ROC-AUC: %.4f, F1: %.4f, Acc: %.4f, Recall: %.4f",
            disease_name.upper(), model_name, metrics["roc_auc"], metrics["f1"], metrics["accuracy"], metrics["recall"]
        )

        # Candidate selection metric: primary ROC-AUC, secondary F1
        composite_score = metrics["roc_auc"] * 0.7 + metrics["f1"] * 0.3
        if composite_score > best_score:
            best_score = composite_score
            best_model_name = model_name

    logger.info("Selected BEST model for '%s': %s (Composite Score: %.4f)", disease_name, best_model_name, best_score)
    best_model = trained_models[best_model_name]

    # Package output bundle
    bundle = {
        "disease_name": disease_name,
        "best_model_name": best_model_name,
        "best_model": best_model,
        "trained_models": trained_models,
        "metrics": model_test_metrics,
        "scaler": scaler,
        "cleaner": cleaner,
        "isolation_forest": isolation_forest,
        "feature_names": feature_names,
        "X_train_scaled": prep_data["X_train_scaled"],
        "y_train": prep_data["y_train"],
        "X_test_scaled": X_test,
        "y_test": y_test
    }

    # 6. Save Artifacts
    if save_artifacts:
        models_dir = Path(config.get("paths", {}).get("models_dir", get_project_root() / "ml" / "models"))
        models_dir.mkdir(parents=True, exist_ok=True)

        bundle_path = models_dir / f"{disease_name}_model_bundle.joblib"
        best_model_path = models_dir / f"{disease_name}_best_model.joblib"
        scaler_path = models_dir / f"{disease_name}_scaler.joblib"
        cleaner_path = models_dir / f"{disease_name}_cleaner.joblib"
        isolation_path = models_dir / f"{disease_name}_isolation_forest.joblib"

        joblib.dump(bundle, bundle_path)
        joblib.dump(best_model, best_model_path)
        joblib.dump(scaler, scaler_path)
        joblib.dump(cleaner, cleaner_path)
        joblib.dump(isolation_forest, isolation_path)

        logger.info("Saved all model artifacts for '%s' to: %s", disease_name, models_dir)

    return bundle


def train_all_diseases(config: Optional[Dict[str, Any]] = None) -> Dict[str, Dict[str, Any]]:
    """
    Train full model pipelines across all 4 diseases.

    Returns:
        Dictionary of results mapping disease_name to its trained bundle.
    """
    if config is None:
        config = load_config()

    all_results = {}
    for disease_name in config.get("diseases", {}).keys():
        all_results[disease_name] = train_disease_pipeline(disease_name, config=config, save_artifacts=True)

    logger.info("Successfully trained pipelines for all configured diseases.")
    return all_results


def parse_args():
    parser = argparse.ArgumentParser(description="Multi-Disease Model Training Pipeline")
    parser.add_argument(
        "--disease",
        type=str,
        default="all",
        choices=["heart", "diabetes", "parkinsons", "liver", "all"],
        help="Disease model to train ('heart', 'diabetes', 'parkinsons', 'liver', or 'all')"
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.disease == "all":
        train_all_diseases()
    else:
        train_disease_pipeline(args.disease)
