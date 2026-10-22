# Dataset Documentation & Preprocessing Audit

This document describes the provenance, schemas, class distributions, and preprocessing strategies for all four clinical datasets integrated into the **Multi-Disease Prediction System**.

---

## 1. Summary Comparison

| Metric / Attribute | Heart Disease | Diabetes | Parkinson's Disease | Liver Disease |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Dataset** | UCI Cleveland Clinic | Pima Indians Diabetes | Oxford Vocal Acoustics | Indian Liver Patient (ILPD) |
| **Origin Repository** | UCI ML Repository (#45) | National Institutes / Kaggle | Oxford / UCI ML Repository | UCI ML Repository (#225) |
| **Raw Sample Count** | 303 patients | 768 female patients | 195 acoustic recordings | 583 records |
| **Cleaned Sample Count** | 303 patients | 768 patients | 195 records | 570 records (13 deduplicated) |
| **Raw Feature Count** | 13 features + 1 target | 8 features + 1 target | 23 features + 1 target | 10 features + 1 target |
| **Target Variable** | `target` (binarized from 0-4) | `Outcome` (0 or 1) | `status` (0 or 1) | `Dataset` (mapped from 1/2 to 1/0) |
| **Class Distribution** | 54.1% Normal / 45.9% Disease | 65.1% Normal / 34.9% Diabetic | 75.4% PD / 24.6% Healthy | 71.4% Liver / 28.6% Healthy |
| **Primary Challenge** | Headerless raw format; `?` marks | Hidden zeroes in vitals | Subject correlation; multicollinear | Duplicate rows; extreme AST/ALT skew |
| **Selected Champion Model** | **XGBoost Classifier** | **Random Forest Classifier** | **K-Nearest Neighbors (KNN)** | **Logistic Regression** |
| **Empirical Test Accuracy** | **90.16%** | **75.32%** | **92.31%** | **72.81%** |
| **Empirical Test ROC-AUC** | **0.9416** | **0.8142** | **0.9966** | **0.8114** |

---

## 2. Dataset Deep Dives

### 2.1 Heart Disease (UCI Cleveland)
- **Features (13):**
  1. `age`: Patient age in years (29 - 77)
  2. `sex`: Biological sex (1 = Male, 0 = Female)
  3. `cp`: Chest pain category (1 = typical angina, 2 = atypical, 3 = non-anginal, 4 = asymptomatic)
  4. `trestbps`: Resting systolic blood pressure in mm Hg (94 - 200)
  5. `chol`: Serum cholesterol in mg/dL (126 - 564)
  6. `fbs`: Fasting blood sugar > 120 mg/dL (1 = true, 0 = false)
  7. `restecg`: Resting electrocardiogram results (0 = normal, 1 = ST-T wave abnormality, 2 = LVH)
  8. `thalach`: Maximum heart rate achieved under stress (71 - 202 bpm)
  9. `exang`: Exercise-induced angina (1 = yes, 0 = no)
  10. `oldpeak`: ST depression induced by exercise relative to rest (0.0 - 6.2 mm)
  11. `slope`: Slope of peak exercise ST segment (1 = upsloping, 2 = flat, 3 = downsloping)
  12. `ca`: Number of major vessels (0-3) colored by fluoroscopy (imputed with median)
  13. `thal`: Thallium scintigraphy defect (3 = normal, 6 = fixed, 7 = reversible)
- **Target Transformation:** Raw Cleveland records multi-class stenosis levels (`0` = <50% diameter narrowing, `1-4` = >50% diameter narrowing). Binarized to `0` (healthy) vs `1` (cardiovascular disease).

---

### 2.2 Diabetes (Pima Indians)
- **Features (8):**
  1. `Pregnancies`: Number of times pregnant (0 - 17)
  2. `Glucose`: Plasma glucose concentration after 2-hour oral glucose tolerance test (44 - 199 mg/dL)
  3. `BloodPressure`: Diastolic blood pressure in mm Hg (24 - 122 mm Hg)
  4. `SkinThickness`: Triceps skin fold thickness in mm (7 - 99 mm)
  5. `Insulin`: 2-Hour serum insulin (14 - 846 μU/mL)
  6. `BMI`: Body Mass Index (18.2 - 67.1 kg/m²)
  7. `DiabetesPedigreeFunction`: Genetic risk score (0.078 - 2.42)
  8. `Age`: Patient age in years (21 - 81)
- **Critical Data Quality Issue:** Hidden clinical zeroes. In living human physiology, glucose, diastolic blood pressure, skin fold thickness, and BMI cannot equal zero. These were treated as missing entries and imputed with training-split medians.

---

### 2.3 Parkinson's Disease (Oxford Biomedical Vocal Acoustics)
- **Features (22 acoustic dimensions):**
  - Average, maximum, and minimum vocal fundamental frequencies (`MDVP:Fo`, `MDVP:Fhi`, `MDVP:Flo`)
  - Jitter variations: `MDVP:Jitter(%)`, `MDVP:Jitter(Abs)`, `MDVP:RAP`, `MDVP:PPQ`, `Jitter:DDP`
  - Shimmer variations: `MDVP:Shimmer`, `MDVP:Shimmer(dB)`, `Shimmer:APQ3`, `Shimmer:APQ5`, `MDVP:APQ`, `Shimmer:DDA`
  - Noise ratios: `NHR` (Noise-to-Harmonics) and `HNR` (Harmonics-to-Noise)
  - Nonlinear dynamical measures: `RPDE` (Recurrence Period Density Entropy), `DFA` (Detrended Fluctuation Analysis), `spread1`, `spread2`, `D2` (Correlation Dimension), and `PPE` (Pitch Period Entropy).
- **Target:** `status` (1 = Parkinson's disease, 0 = Healthy control).
- **Non-predictive Column Dropped:** `name` (subject identifier string e.g. `phon_R01_S01_1`).

---

### 2.4 Liver Disease (Indian Liver Patient Dataset - ILPD)
- **Features (10):**
  1. `Age`: Patient age (4 - 90 years)
  2. `Gender`: Encoded as 1 (Male) vs 0 (Female)
  3. `Total_Bilirubin`: Conjugated + unconjugated serum bilirubin (0.4 - 75.0 mg/dL)
  4. `Direct_Bilirubin`: Conjugated bilirubin (0.1 - 19.7 mg/dL)
  5. `Alkaline_Phosphotase`: Serum ALP enzyme (63 - 2110 U/L)
  6. `Alamine_Aminotransferase`: Serum ALT / SGPT enzyme (10 - 2000 U/L)
  7. `Aspartate_Aminotransferase`: Serum AST / SGOT enzyme (10 - 4929 U/L)
  8. `Total_Protiens`: Total serum protein (2.7 - 9.6 g/dL)
  9. `Albumin`: Serum albumin (0.9 - 5.5 g/dL)
  10. `Albumin_and_Globulin_Ratio`: A/G ratio (0.3 - 2.8; missing values imputed with median)
- **Target Mapping:** Raw coding `{1: Liver Patient, 2: Healthy}` re-mapped to standard binary `{1: Disease, 0: Healthy}`.
- **Deduplication:** 13 identical patient entries pruned.
