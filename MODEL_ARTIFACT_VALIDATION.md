# Model Artifact Validation Report

## Multi-Disease Prediction System

**Date of Validation:** October 2026  
**Environment:** Python 3.14.6 / scikit-learn 1.9.1 / xgboost 2.x / shap 0.53.0 / scipy 1.18.1  
**Original Artifact Training Version:** scikit-learn 1.4.2  
**Artifact Directory:** `ml/models/`

---

## 1. Overview of Artifacts

The system relies on 4 primary model bundles and 16 standalone model/scaler/evaluation artifacts located in `ml/models/`. Every bundle encapsulates:
- `best_model`: The champion estimator chosen by validation metrics
- `best_model_name`: String name of the model (e.g., `XGBoost`, `RandomForest`, `KNN`, `LogisticRegression`)
- `feature_names`: Exact ordered list of required clinical features
- `scaler`: Fitted `StandardScaler`
- `cleaner`: Fitted `DataCleaner` with learned numerical medians and categorical mode imputations
- `metrics`: Dictionary of evaluation scores (Accuracy, Precision, Recall, F1, ROC-AUC)

---

## 2. Validation Matrix per Disease

### 2.1 Heart Disease

- **Bundle Artifact:** `heart_model_bundle.joblib`
- **Standalone Artifact:** `heart_model.joblib`
- **Target Column:** `target` (mapped from raw `num` 0-4 to binary 0/1)
- **Features (13):**
  `['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']`
- **Selected Champion Model:** `XGBoost` (`XGBClassifier`)
- **Validation Smoke Test:**
  - Input sample: `age=55, sex=1, cp=3, trestbps=140, chol=240, fbs=0, restecg=1, thalach=150, exang=0, oldpeak=1.2, slope=2, ca=0, thal=3`
  - Output: `Prediction = 0`, `Probability = 0.0966`, `Risk Level = Low`
  - Explainability: SHAP `TreeExplainer` successfully computes feature attributions.
- **Status:** **VALIDATED & PASSING**

---

### 2.2 Diabetes

- **Bundle Artifact:** `diabetes_model_bundle.joblib`
- **Standalone Artifact:** `diabetes_model.joblib`
- **Target Column:** `Outcome` (binary 0/1)
- **Features (8):**
  `['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age']`
- **Selected Champion Model:** `RandomForest` (`RandomForestClassifier`)
- **Validation Smoke Test:**
  - Input sample: `pregnancies=6, glucose=148, blood_pressure=72, skin_thickness=35, insulin=0, bmi=33.6, diabetes_pedigree=0.627, age=50`
  - Zero-as-missing transformation: `insulin=0` correctly recognized and imputed via learned median.
  - Output: `Prediction = 1`, `Probability = 0.9600`, `Risk Level = Critical`
  - Explainability: SHAP `TreeExplainer` successfully computes feature attributions.
- **Status:** **VALIDATED & PASSING**

---

### 2.3 Parkinson's Disease

- **Bundle Artifact:** `parkinsons_model_bundle.joblib`
- **Standalone Artifact:** `parkinsons_model.joblib`
- **Target Column:** `status` (binary 0/1; raw `name` column dropped)
- **Features (22):**
  `['D2', 'DFA', 'HNR', 'Jitter:DDP', 'MDVP:APQ', 'MDVP:Fhi(Hz)', 'MDVP:Flo(Hz)', 'MDVP:Fo(Hz)', 'MDVP:Jitter(%)', 'MDVP:Jitter(Abs)', 'MDVP:PPQ', 'MDVP:RAP', 'MDVP:Shimmer', 'MDVP:Shimmer(dB)', 'NHR', 'PPE', 'RPDE', 'Shimmer:APQ3', 'Shimmer:APQ5', 'Shimmer:DDA', 'spread1', 'spread2']`
- **Selected Champion Model:** `KNN` (`KNeighborsClassifier`)
- **Feature Name Alignment Verification:**
  - Serializer inputs use snake_case identifiers (e.g., `mdvp_fo`, `mdvp_jitter_percent`).
  - `apps.parkinsons.services.ParkinsonsPredictionService.API_TO_MODEL_FEATURE_MAP` provides 1:1 translation for all 22 biomarkers.
  - Zero feature dropouts or unintended fallbacks to median defaults observed.
- **Validation Smoke Test:**
  - Input sample: Dysphonic voice acoustics (`mdvp_fo=119.992, mdvp_jitter_percent=0.00784, hnr=21.033, etc.`)
  - Output: `Prediction = 1`, `Probability = 1.0000`, `Risk Level = Critical`
- **Status:** **VALIDATED & PASSING**

---

### 2.4 Liver Disease

- **Bundle Artifact:** `liver_model_bundle.joblib`
- **Standalone Artifact:** `liver_model.joblib`
- **Target Column:** `Dataset` (mapped 1 -> 1 [Patient], 2 -> 0 [Healthy])
- **Features (10):**
  `['Age', 'Gender', 'Total_Bilirubin', 'Direct_Bilirubin', 'Alkaline_Phosphotase', 'Alamine_Aminotransferase', 'Aspartate_Aminotransferase', 'Total_Protiens', 'Albumin', 'Albumin_and_Globulin_Ratio']`
- **Selected Champion Model:** `LogisticRegression`
- **Categorical Handling:**
  - `Gender` string inputs (`"Male"`, `"Female"`) are correctly converted to numerical encodings (`Male -> 1`, `Female -> 0`) by `DataCleaner`.
- **Validation Smoke Test:**
  - Input sample: Normal reference values (`Age=65, Gender="Male", Total_Bilirubin=0.7, Direct_Bilirubin=0.1, etc.`)
  - Output: `Prediction = 0`, `Probability = 0.4320`, `Risk Level = Moderate`
- **Status:** **VALIDATED & PASSING**

---

## 3. Version Compatibility & Serialization Notes

- Artifacts were serialized using `joblib` under scikit-learn 1.4.2.
- Running unpickling in environments with newer scikit-learn (e.g. 1.9.1) emits an `InconsistentVersionWarning`, but numerical structures, coefficients, tree splits, and k-d tree indexes are fully intact and functional.
- For maximum deployment stability and reproducibility, `ml/models/*.joblib` are tracked in git and bundled directly with the application runtime.
