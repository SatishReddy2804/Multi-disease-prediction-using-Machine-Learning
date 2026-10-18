# Clinical Dataset Inspection & Preprocessing Specification

## Multi-Disease Prediction System (ML & DRF)

This document provides the clinical schemas, statistical distributions, anomalies, missing-value semantics, and preprocessing protocols across all four disease datasets used in the Multi-Disease Prediction System.

---

## 1. Diabetes Dataset (`data/raw/diabetes.csv`)

- **Domain Source**: Pima Indians Diabetes Database (National Institute of Diabetes and Digestive and Kidney Diseases).
- **Dimensions**: 768 patient observations, 9 columns (8 clinical features, 1 target).
- **Target Feature**: `Outcome` (Binary: `0` = Non-Diabetic, `1` = Diabetic).
- **Class Balance**: 500 Negative (65.1%), 268 Positive (34.9%).

### Schema & Physiological Validation Ranges
| Feature Name | Type | Physiological Range | Description | Notes / Zero Handling |
| :--- | :--- | :--- | :--- | :--- |
| `Pregnancies` | Integer | [0, 20] | Number of times pregnant | Biological zero is valid. |
| `Glucose` | Float | [40.0, 350.0] mg/dL | Plasma glucose concentration (2 hrs OGTT) | **0 is physiologically impossible** for living patients; treated as missing and imputed via median. |
| `BloodPressure` | Float | [40.0, 220.0] mmHg | Diastolic blood pressure | **0 is physiologically impossible**; treated as missing and imputed via median. |
| `SkinThickness` | Float | [5.0, 99.0] mm | Triceps skin fold thickness | **0 is invalid** (unmeasured); imputed via median. |
| `Insulin` | Float | [2.0, 900.0] μU/mL | 2-Hour serum insulin | **0 is invalid** (unmeasured); imputed via median. |
| `BMI` | Float | [12.0, 80.0] kg/m² | Body mass index | **0 is invalid**; imputed via median. |
| `DiabetesPedigreeFunction`| Float | [0.05, 3.0] | Genetic predisposition scoring function | Biological non-zero. |
| `Age` | Integer | [21, 100] years | Patient age | Biological integer. |
| `Outcome` | Integer | {0, 1} | Ground truth classification | Target variable. |

---

## 2. Heart Disease Dataset (`data/raw/heart.csv`)

- **Domain Source**: Cleveland Heart Disease Database (UCI Machine Learning Repository).
- **Dimensions**: 303 patient observations, 14 columns.
- **CSV Format**: Originally headerless; mapped to canonical schema during ingestion.
- **Target Semantics**: In raw clinical data, `target` ranges from `0` (absence) to `1, 2, 3, 4` (increasing stenosis severity). For clinical binary triage, values `[1, 2, 3, 4]` are mapped to `1` (Heart Disease Present) and `0` to `0` (Heart Disease Absent).
- **Class Balance**: 164 Absent (54.1%), 139 Present (45.9%).

### Schema & Clinical Features
| Feature Name | Type | Range / Categories | Description |
| :--- | :--- | :--- | :--- |
| `age` | Float | [29, 77] years | Patient age in years |
| `sex` | Integer | {0 = Female, 1 = Male} | Biological sex |
| `cp` | Integer | {1: Typical Angina, 2: Atypical Angina, 3: Non-anginal, 4: Asymptomatic} | Chest pain classification |
| `trestbps` | Float | [94.0, 200.0] mmHg | Resting systolic blood pressure on hospital admission |
| `chol` | Float | [126.0, 564.0] mg/dL | Serum cholesterol |
| `fbs` | Integer | {0 = False, 1 = True} | Fasting blood sugar > 120 mg/dL |
| `restecg` | Integer | {0: Normal, 1: ST-T abnormality, 2: LV hypertrophy} | Resting electrocardiographic measurement |
| `thalach` | Float | [71.0, 202.0] bpm | Maximum heart rate achieved during stress test |
| `exang` | Integer | {0 = No, 1 = Yes} | Exercise-induced angina |
| `oldpeak` | Float | [0.0, 6.2] | ST depression induced by exercise relative to rest |
| `slope` | Integer | {1: Upsloping, 2: Flat, 3: Downsloping} | Slope of the peak exercise ST segment |
| `ca` | Float | [0, 3] | Number of major vessels (0-3) colored by flourosopy |
| `thal` | Integer | {3: Normal, 6: Fixed defect, 7: Reversible defect} | Thallium scintigraphy stress test |
| `target` | Integer | {0, 1} | Coronary artery stenosis >= 50% |

---

## 3. Liver Disease Dataset (`data/raw/liver.csv`)

- **Domain Source**: Indian Liver Patient Records (ILPD / UCI Machine Learning Repository).
- **Dimensions**: 583 observations, 11 columns.
- **CSV Format**: Headerless raw CSV; mapped to standardized schema during ingestion.
- **Target Feature**: Raw column 11 labeled `Dataset` where `1` = Liver Patient (Disease Present) and `2` = Non-Liver Patient (Disease Absent). Mapped to canonical standard: `1` = Positive, `0` = Negative.
- **Duplicates**: Contains 13 duplicate patient records. De-duplicated in training; retained in single-patient inference.
- **Missing Values**: `Albumin_and_Globulin_Ratio` contains 4 missing rows; imputed via column median.
- **Categorical Encoding**: `Gender` ('Male'/'Female') mapped to numeric binary encoding (Male = 1, Female = 0).

### Schema & Features
| Feature Name | Type | Range / Unit | Clinical Description |
| :--- | :--- | :--- | :--- |
| `Age` | Float | [4, 90] years | Age of the patient |
| `Gender` | String / Int | {Male: 1, Female: 0} | Patient biological sex |
| `Total_Bilirubin` | Float | [0.4, 75.0] mg/dL | Total serum bilirubin level |
| `Direct_Bilirubin` | Float | [0.1, 19.7] mg/dL | Conjugated bilirubin |
| `Alkaline_Phosphotase` | Float | [63, 2110] U/L | Serum alkaline phosphatase enzyme |
| `Alamine_Aminotransferase` | Float | [10, 2000] U/L | ALT transaminase (liver injury marker) |
| `Aspartate_Aminotransferase` | Float | [10, 4929] U/L | AST transaminase |
| `Total_Protiens` | Float | [2.7, 9.6] g/dL | Serum total protein |
| `Albumin` | Float | [0.9, 5.5] g/dL | Liver-synthesized albumin protein |
| `Albumin_and_Globulin_Ratio` | Float | [0.3, 2.8] | Ratio of albumin to globulin fraction |
| `Dataset` (Target) | Integer | {1: Disease, 0: Healthy} | Diagnosis |

---

## 4. Parkinson's Disease Dataset (`data/raw/parkinsons.csv`)

- **Domain Source**: Max Little, University of Oxford (Biomedical Voice Acoustic Measurements).
- **Dimensions**: 195 acoustic recordings, 24 columns.
- **Identifier Feature**: `name` (Patient voice recording ID, e.g. `phon_R01_S01_1`). **Explicitly dropped** during ingestion and never supplied to models.
- **Target Feature**: `status` (Binary: `1` = Parkinson's Disease, `0` = Healthy control).
- **Class Balance**: 147 PD positive (75.4%), 48 Healthy (24.6%). Balanced via SMOTE / class weighting in training.

### Schema & Dysphonia Acoustic Features
| Feature Name | Category | Clinical Description |
| :--- | :--- | :--- |
| `MDVP:Fo(Hz)` | Pitch / Frequency | Average vocal fundamental frequency |
| `MDVP:Fhi(Hz)` | Pitch / Frequency | Maximum vocal fundamental frequency |
| `MDVP:Flo(Hz)` | Pitch / Frequency | Minimum vocal fundamental frequency |
| `MDVP:Jitter(%)`, `MDVP:Jitter(Abs)`, `MDVP:RAP`, `MDVP:PPQ`, `Jitter:DDP` | Frequency Perturbation | Vocal cord micro-frequency instability measures (jitter) |
| `MDVP:Shimmer`, `MDVP:Shimmer(dB)`, `Shimmer:APQ3`, `Shimmer:APQ5`, `MDVP:APQ`, `Shimmer:DDA` | Amplitude Perturbation | Micro-amplitude variations in phonation (shimmer) |
| `NHR`, `HNR` | Harmonic Noise | Noise-to-harmonics ratio & harmonics-to-noise ratio |
| `RPDE`, `D2` | Nonlinear Dynamical | Recurrence period density entropy & correlation dimension |
| `DFA` | Fractal Scaling | Detrended fluctuation analysis measuring vocal signal turbulence |
| `spread1`, `spread2`, `PPE` | Pitch Period Entropy | Non-linear fundamental frequency variation measures |

---

## 5. Preprocessing & Outlier Pipeline
1. **Cleaning**: Missing continuous values imputed using train-set median. Zeroes in non-zero physiological parameters flagged and imputed.
2. **Feature Alignment**: Strict 1-to-1 ordered feature mapping matching training configuration schemas.
3. **Scaling**: `StandardScaler` fitted on training split and bundled alongside the estimator.
4. **Outlier Filtering**: `IsolationForest` fitted per disease module to evaluate patient out-of-distribution (OOD) risk.
