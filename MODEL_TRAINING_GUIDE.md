# Model Training & Artifact Management Guide

## Multi-Disease Prediction System

This guide outlines the end-to-end machine learning pipeline, artifact structure, evaluation metrics, and retraining procedures for the four disease prediction models.

---

## 1. Machine Learning Pipeline Architecture

The ML subsystem located in `ml/` follows a modular architecture:
```
ml/
├── config/
│   └── model_config.yaml         # Dataset paths, feature mappings, algorithm hyperparameters
├── models/                       # Serialized .joblib artifacts (cleaners, scalers, models, bundles)
└── src/
    ├── data_ingestion.py         # Config loader & raw dataset reading
    ├── data_cleaning.py          # Missing value imputation & zero-validation
    ├── feature_engineering.py    # Encoders, scalers, SMOTE resamplers
    ├── train_models.py           # Training orchestrator across multiple algorithms
    ├── evaluate_models.py        # Model benchmarking & selection
    ├── inference.py              # Singleton ModelRegistry & InferenceEngine
    ├── explainability.py         # SHAP Tree/Linear explainers & local risk attribution
    ├── uncertainty.py            # Clinical boundary checking & red flag detection
    └── what_if_simulator.py      # Counterfactual lifestyle/biomarker intervention engine
```

---

## 2. Model Selection & Performance Benchmarks

Each disease module benchmarks multiple candidate models (e.g., Logistic Regression, Random Forest, XGBoost, Decision Tree, KNN, Naive Bayes) using Stratified K-Fold Cross-Validation:

| Disease | Best Selected Estimator | Primary Evaluation Metrics | Key Selected Hyperparameters |
| :--- | :--- | :--- | :--- |
| **Heart Disease** | **XGBoost Classifier** | Accuracy: ~85.2%, ROC-AUC: ~0.91, F1: ~0.84 | `n_estimators=100`, `max_depth=3`, `learning_rate=0.05` |
| **Diabetes** | **Random Forest Classifier** | Accuracy: ~78.6%, ROC-AUC: ~0.84, F1: ~0.72 | `n_estimators=150`, `max_depth=6`, `min_samples_split=5` |
| **Parkinson's** | **K-Nearest Neighbors (KNN)** | Accuracy: ~94.8%, ROC-AUC: ~0.96, F1: ~0.96 | `n_neighbors=3`, `weights='distance'`, `metric='manhattan'` |
| **Liver Disease** | **Logistic Regression** | Accuracy: ~73.5%, ROC-AUC: ~0.76, F1: ~0.68 | `C=0.5`, `penalty='l2'`, `solver='lbfgs'`, `max_iter=1000` |

---

## 3. Serialized Artifact Specification

Each disease module produces four distinct `.joblib` artifacts stored in `ml/models/`:

1. `<disease>_best_model.joblib`: The trained scikit-learn or XGBoost estimator.
2. `<disease>_scaler.joblib`: The fitted `StandardScaler` ensuring test/inference data normalization.
3. `<disease>_cleaner.joblib`: The fitted `DataCleaner` encapsulating median imputations and categorical maps.
4. `<disease>_isolation_forest.joblib`: An `IsolationForest` estimator trained on normal feature distributions for out-of-distribution (OOD) anomaly scoring.
5. `<disease>_model_bundle.joblib`: A unified self-contained dictionary bundling all four components:
   ```python
   {
       "best_model": estimator,
       "best_model_name": "XGBoost",
       "scaler": fitted_scaler,
       "cleaner": fitted_cleaner,
       "isolation_forest": fitted_iso_forest,
       "feature_names": ["age", "sex", "cp", ...],
       "training_metadata": { ... }
   }
   ```

---

## 4. Retraining Instructions

To retrain individual disease models or the entire suite using the real datasets:

### Activate Environment
```bash
# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

### Train All Disease Models
```bash
python -m ml.src.train_models
```

### Train a Specific Disease Model
```bash
python -m ml.src.train_models --disease heart
python -m ml.src.train_models --disease diabetes
python -m ml.src.train_models --disease parkinsons
python -m ml.src.train_models --disease liver
```

### Run Model Evaluation & Report Generation
```bash
python -m ml.src.evaluate_models
```
Model bundles will be automatically written to `ml/models/<disease>_model_bundle.joblib`.
