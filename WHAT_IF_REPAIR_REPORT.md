# What-If Simulator Permanent Repair & Verification Report

**Project:** Multi-Disease Clinical Decision Support System  
**Repository:** `SatishReddy2804/Multi-disease-prediction-using-Machine-Learning`  
**Date:** October 26, 2026  
**Status:** **PERMANENTLY REPAIRED & VERIFIED** (11/11 What-If tests PASS, 10/10 Cross-Risk tests PASS, Vite production build PASS)

---

## 1. Root Causes Discovered

Three distinct defects caused the failure and crash in the What-If Simulator:

### Root Cause 1: The `Interface Error Caught` TypeError Crash
* **Exact Crash:** `TypeError: Cannot read properties of undefined (reading 'cp')`
* **Mechanism:** In `WhatIfPanel.jsx` (line 193), the component rendered each modifiable field slider and attempted to look up the original baseline value:
  ```javascript
  const orig = originalInputs[field.name] ?? field.defaultValue;
  ```
  However, `WhatIfPage.jsx` passed `baselineInputs={...}`, leaving `originalInputs` as `undefined`. When evaluating the heart disease field `cp` (chest pain type), the JavaScript runtime evaluated `undefined['cp']`, throwing the unhandled `TypeError` caught by the workspace error boundary.
* **Secondary Prop Mismatch:** `WhatIfPage.jsx` passed `currentProbability={0.76}`, whereas `WhatIfPanel.jsx` read `baselineProbability` directly for the baseline RadialConfidenceRing, causing prop desynchronization and static demo values.

### Root Cause 2: Fabricated Heuristic Backend & Frontend Fallbacks
* **Backend:** In `apps/what_if/services.py`, an exception handler trapped inference failures and returned fabricated risk numbers:
  ```python
  return {
      "baseline_probability": 0.65,
      "counterfactual_probability": 0.42,
      "absolute_risk_reduction": 0.23,
      "percentage_change": -35.4,
      "warning": "Simulation executed via heuristic estimation ..."
  }
  ```
* **Frontend:** In `whatIfService.js`, the catch block called two predictions and computed feature impact using an arbitrary formula `(diffRatio * 15).toFixed(1)`, presenting an arbitrary number as an ML-derived feature impact.
* **Consequence:** Model or input failures never surfaced to the clinician; instead, fabricated results were displayed as if real inference had succeeded.

### Root Cause 3: Disconnected Patient Baseline & Hardcoded Demo Probabilities
* `WhatIfPage.jsx` contained hardcoded `diseaseDefaults` with constant values (e.g. `currentProbability={0.76}`) instead of pulling from the authenticated patient's actual diagnostic inference history.
* If a clinician opened the What-If Simulator without having evaluated the patient for that disease, it rendered fake patient data rather than informing the user that a baseline evaluation was required.

---

## 2. Exact Files Changed and Changes Implemented

| File | Type | Summary of Changes |
|---|---|---|
| `multi_disease_prediction_system/frontend/src/components/WhatIfPanel.jsx` | **Modified** | Fixed undefined property access bug on line 193 by normalizing `actualOriginalInputs = originalInputs \|\| baselineInputs \|\| {}`. Normalized baseline probability prop. Configured disease-specific actionable biomarkers matching `model_config.yaml`. Added locked immutable parameters indicator. Added Parkinson's acoustic disclaimer. Added real error boundary state. |
| `multi_disease_prediction_system/frontend/src/pages/WhatIfPage.jsx` | **Modified** | Eliminated `diseaseDefaults` and hardcoded `0.76` probability. Connected directly to `clinical_prediction_history` in `localStorage`. Implemented clean actionable empty state when no patient baseline exists, providing direct one-click navigation to the disease evaluation page. |
| `multi_disease_prediction_system/frontend/src/services/whatIfService.js` | **Modified** | Removed the offline fallback and the heuristic `diffRatio * 15` calculation. Standardized API payload to canonical contract. Normalizes response and propagates real errors directly. |
| `multi_disease_prediction_system/apps/what_if/services.py` | **Modified** | Completely removed the fabricated fallback dictionary. Integrates with `run_what_if_simulation` to execute genuine counterfactual inference using existing trained models. Re-raises exceptions so views return meaningful HTTP error statuses. |
| `multi_disease_prediction_system/apps/what_if/views.py` | **Modified** | Enhanced exception handling: returns structured HTTP 400 for `ValueError` (invalid range or non-modifiable field) and HTTP 500 for internal errors without leaking server internals. |
| `multi_disease_prediction_system/ml/src/what_if_simulator.py` | **Modified** | Replaced silent value clamping with explicit boundary validation. Implemented exact risk change formulas: `absolute_change = p_modified - p_original`, percentage points `* 100`, and safe `relative_change_percent` (`None` when `p_original == 0`). Added Parkinson's acoustic warning. |
| `multi_disease_prediction_system/apps/what_if/tests.py` | **Created** | 11 comprehensive automated tests verifying serializer validation, real ML inference across all 4 disease models, boundary rejection, and API view responses. |

---

## 3. Existing Prediction and Preprocessing Functions Reused

No new model was trained and no preprocessing logic was duplicated. The simulator strictly reuses:
1. `ml.src.inference.get_inference_engine()` & `InferenceEngine.predict(disease_name, input_data)`:
   * Reuses the existing cached model bundles (`heart_model_bundle.joblib`, `diabetes_model_bundle.joblib`, `liver_model_bundle.joblib`, `parkinsons_model_bundle.joblib`).
   * Reuses `bundle["cleaner"].transform(df, drop_duplicates=False)` for exact data cleaning.
   * Reuses `bundle["scaler"].transform(ordered_features)` for exact feature scaling.
   * Reuses `best_model.predict_proba()` with positive-class column index `1`.
   * Reuses `map_risk_level(prob_disease)` for clinical risk stratification.

---

## 4. How Baseline Data Reaches the Simulator

1. **Intake & Prediction:** When a clinician runs any disease diagnostic form (`/predict/heart`, `/predict/diabetes`, etc.), `predictionService.predict()` evaluates the model and stores the validated record into `clinical_prediction_history` in `localStorage`.
2. **Simulator Loading:** `WhatIfPage.jsx` reads `clinical_prediction_history` on mount. For the selected disease tab, it extracts:
   * `inputs`: Complete patient feature dictionary.
   * `probability`: Genuine initial probability (0.0 to 1.0).
   * `risk_level`: Calibrated categorical risk.
   * `model_used`: Specific estimator name.
   * `patient`: Patient identifier / metadata.
3. **Missing Baseline Handling:** If no genuine evaluation exists for the selected disease, the simulator displays an informative notice explaining that baseline evaluation is required and provides a direct link to run the evaluation form. It does not fabricate default patient data.

---

## 5. Final API Request and Response Contract

### Canonical Request (`POST /api/what-if/simulate/`)
```json
{
  "disease_type": "heart",
  "original_input": {
    "age": 58,
    "sex": 1,
    "cp": 4,
    "trestbps": 160,
    "chol": 280,
    "fbs": 1,
    "restecg": 2,
    "thalach": 125,
    "exang": 1,
    "oldpeak": 2.8,
    "slope": 2,
    "ca": 2,
    "thal": 7
  },
  "modified_values": {
    "trestbps": 120,
    "chol": 190
  }
}
```

### Canonical Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "disease_type": "heart",
  "original_risk": {
    "probability": 0.2769,
    "risk_percentage": 27.7,
    "prediction": 0,
    "risk_level": "Moderate"
  },
  "modified_risk": {
    "probability": 0.0533,
    "risk_percentage": 5.3,
    "prediction": 0,
    "risk_level": "Low"
  },
  "what_if_result": {
    "risk_direction": "decreased",
    "absolute_change": -0.2236,
    "percentage_points_change": -22.4,
    "relative_change_percent": -80.75,
    "changed_features": [
      {
        "feature": "trestbps",
        "display_name": "Resting Blood Pressure",
        "original_value": 160.0,
        "modified_value": 120.0,
        "unit": "mm Hg",
        "difference": -40.0,
        "healthy_target": 115
      },
      {
        "feature": "chol",
        "display_name": "Serum Cholesterol",
        "original_value": 280.0,
        "modified_value": 190.0,
        "unit": "mg/dL",
        "difference": -90.0,
        "healthy_target": 190
      }
    ],
    "message": "Substantial risk reduction achievable with proposed lifestyle/therapeutic modifications.",
    "disclaimer": "What-If results are simulated educational estimates. They do not guarantee that changing a clinical value will change an actual medical outcome. Always consult a qualified doctor for diagnosis, treatment, or medication decisions."
  },
  "model_used": "RandomForestClassifier",
  "ranked_interventions": [
    {
      "feature": "chol",
      "display_name": "Serum Cholesterol",
      "marginal_risk_delta": -0.1962,
      "marginal_pct_change": -19.6,
      "is_beneficial": true
    },
    {
      "feature": "trestbps",
      "display_name": "Resting Blood Pressure",
      "marginal_risk_delta": -0.0582,
      "marginal_pct_change": -5.8,
      "is_beneficial": true
    }
  ]
}
```

---

## 6. How Fabricated Fallbacks Were Removed

1. `apps/what_if/services.py`: Deleted hardcoded fallback block returning `0.65` / `0.42` / `-35.4%`. Any ML or preprocessing failure now logs the error and raises, returning HTTP 400 or HTTP 500.
2. `ml/src/what_if_simulator.py`: Removed silent boundary clamping. Invalid or out-of-range inputs now raise descriptive validation errors.
3. `frontend/src/services/whatIfService.js`: Deleted the local prediction fallback and `diffRatio * 15` calculation. Real API errors are thrown directly to trigger the UI error state.

---

## 7. Verification Results & Executed Commands

### 1. What-If Automated Backend Test Suite
```powershell
python manage.py test apps.what_if
```
**Results:** `Ran 11 tests in 3.896s — OK`
* `test_valid_heart_payload`: **PASS**
* `test_reject_invalid_disease`: **PASS**
* `test_reject_empty_original_or_modified`: **PASS**
* `test_reject_immutable_field_modification`: **PASS**
* `test_heart_simulation_genuine_inference`: **PASS** (Real model inference: 0.2769 -> 0.0533)
* `test_diabetes_simulation_genuine_inference`: **PASS** (Real model inference: 0.8600 -> 0.2100)
* `test_liver_simulation_genuine_inference`: **PASS** (Real model inference: 0.7121 -> 0.5846)
* `test_parkinsons_simulation_and_warning`: **PASS** (Real model inference: 1.0000 -> 1.0000 with acoustic disclaimer)
* `test_out_of_bounds_modification_rejected`: **PASS** (Rejects `trestbps: 999` with ValueError)
* `test_api_valid_simulation`: **PASS** (HTTP 200 with standard schema)
* `test_api_invalid_payload_returns_400`: **PASS** (HTTP 400 with validation details)

### 2. Cross-Risk Regression Test Suite
```powershell
python manage.py test apps.cross_risk
```
**Results:** `Ran 10 tests in 0.659s — OK` (**PASS** — No regressions)

### 3. Django System Check
```powershell
python manage.py check
```
**Results:** `System check identified no issues (0 silenced).` (**PASS**)

### 4. Frontend Production Build
```powershell
npm run build (Vite 5.4.21)
```
**Output:**
```
✓ 2016 modules transformed.
dist/index.html                           1.30 kB │ gzip:   0.74 kB
dist/assets/index-BXvWklDJ.css           58.72 kB │ gzip:   9.19 kB
dist/assets/index-b4ZyYRQJ.js         1,207.76 kB │ gzip: 367.50 kB
✓ built in 13.54s
```
**Results:** **PASS** (Zero syntax, bundling, or JSX errors)

---

## 8. Confirmations Required by Completion Criteria

* [x] **No new model was trained:** Reuses existing trained joblib model bundles.
* [x] **No new dataset was created or downloaded:** Reuses existing feature schemas and data cleaning pipelines.
* [x] **No fabricated probabilities remain:** Removed all heuristic fallbacks from frontend and backend.
* [x] **Cross-Risk Radar was not broken:** Verified via 10/10 automated tests passing.
* [x] **The `Cannot read properties of undefined (reading 'cp')` error is resolved:** Props and input keys are safely guarded.
* [x] **Medical disclaimer is displayed:** Visible across all four disease simulation screens.
