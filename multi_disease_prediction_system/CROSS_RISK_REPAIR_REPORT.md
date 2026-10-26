# Cross-Risk Engine & Radar Chart Repair Report

**Project:** Multi-Disease Prediction System  
**Repository:** `SatishReddy2804/Multi-disease-prediction-using-Machine-Learning`  
**Date:** October 26, 2026  
**Status:** **REPAIRED & VERIFIED** (10/10 automated tests PASS, Vite production build PASS)

---

## 1. Executive Summary & Confirmed Root Causes

The Multi-Disease Cross-Risk Engine and its corresponding Radar Chart failed to function in production due to three interconnected defects spanning the frontend request preparation, API serialization, and backend service processing:

### Root Cause 1: Double Payload Nesting & Serialization Crash
* **What Happened:** In `CrossRiskPage.jsx`, the click handler built a valid payload: `{ predictions: [ { disease: "heart", probability: 0.72, ... } ] }`. However, in `crossRiskService.js`, the service wrapped the incoming parameter a second time: `api.post('/api/cross-risk/analyze/', { risks: diseaseRiskMap })`.
* **The Crash:** The backend serializer (`CrossRiskAnalysisSerializer`) received `{ "risks": { "predictions": [...] } }`. The `risks` field validator expected flat floating-point values (`DictField(child=FloatField)`), but received an array of objects. Python crashed during deserialization with a 400 Bad Request error.

### Root Cause 2: Deceptive Silent Offline Fallback
* **What Happened:** When the API call returned HTTP 400, `crossRiskService.js` had a `try/catch` block that silently caught the exception and generated hardcoded fallback values (`heart: 0.35`, `diabetes: 0.45`, etc.).
* **The Schema Mismatch:** The offline fallback object returned keys (`cluster`, `clusterSeverity`, `diseaseScores`, `globalSystemicIndex`) that did not match what the page expected (`radar_chart_data`, `primary_cluster`, `overall_priority`, `scores`). As a result, the UI failed to render and the radar chart remained blank. Real errors were completely hidden from the user.

### Root Cause 3: Fabricated Missing Disease Probabilities & Scale Inconsistencies
* **What Happened:** In `apps/cross_risk/services.py`, when a patient had predictions for only 1 or 2 diseases (e.g., heart and diabetes), the backend was using fallback defaults (`prob_map.get("liver", 0.2)`, `prob_map.get("parkinsons", 0.1)`), fabricating fake clinical probabilities for unexamined organs.
* **Radar Scale Discrepancy:** The radar chart component had conflicting logic for data scales—expecting 0.0–1.0 in some branches and 0–100 in others, and falling back to hardcoded demo constants (`40, 50, 25, 20`) when data was missing. Unevaluated diseases were plotted as 0% risk rather than remaining unavailable.

---

## 2. Exact Files Modified & Created

| File | Status | Description of Changes |
|---|---|---|
| `multi_disease_prediction_system/frontend/src/services/crossRiskService.js` | **Modified** | Removed silent fallback. Standardized request contract to `{ predictions: [...] }`. Added auto-normalization for legacy maps. Propagated real errors to UI. |
| `multi_disease_prediction_system/apps/cross_risk/serializers.py` | **Modified** | Hardened `CrossRiskAnalysisSerializer` to accept both `{ predictions: [...] }` and flat/nested `{ risks: {...} }`. Safely sanitizes float conversions. |
| `multi_disease_prediction_system/apps/cross_risk/services.py` | **Modified** | Eliminated fabricated default probabilities. Missing diseases are flagged as `unavailable` rather than assigned fake values. Computes radar data and syndromic clusters strictly from evaluated organs. |
| `multi_disease_prediction_system/apps/cross_risk/views.py` | **Modified** | Improved error handling and logging; returns descriptive error details rather than generic 500 error messages. |
| `multi_disease_prediction_system/frontend/src/components/CrossRiskRadarChart.jsx` | **Modified** | Built robust 0–100% radial scale. Handles loading, error, empty, and partial-evaluation states. Marks unevaluated domains as unavailable with links to run respective disease models. |
| `multi_disease_prediction_system/frontend/src/pages/CrossRiskPage.jsx` | **Modified** | Implemented dual-mode architecture: (1) **Patient Clinical Profile Mode** connecting directly to real patient inferences from `localStorage` history, and (2) **Simulation Mode** with clearly demarcated demo sliders. |
| `multi_disease_prediction_system/apps/cross_risk/tests.py` | **Created** | Comprehensive unit and integration test suite covering serializer validation, service syndromic detection, and API view behavior. |

---

## 3. Before-and-After API Request & Response Contracts

### Request Contract

#### BEFORE (Broken Double-Wrapped Payload):
```json
POST /api/cross-risk/analyze/
{
  "risks": {
    "predictions": [
      {
        "disease": "heart",
        "probability": 0.72,
        "risk_level": "High",
        "predicted_class": 1
      }
    ]
  }
}
```
*Result:* `400 Bad Request` — `{"risks": {"predictions": ["A valid number is required."]}}`

#### AFTER (Standardized & Validated Contract):
```json
POST /api/cross-risk/analyze/
{
  "predictions": [
    {
      "disease": "heart",
      "probability": 0.72,
      "risk_level": "High",
      "predicted_class": 1
    },
    {
      "disease": "diabetes",
      "probability": 0.68,
      "risk_level": "High",
      "predicted_class": 1
    },
    {
      "disease": "liver",
      "probability": 0.61,
      "risk_level": "High",
      "predicted_class": 1
    },
    {
      "disease": "parkinsons",
      "probability": 0.22,
      "risk_level": "Low",
      "predicted_class": 0
    }
  ]
}
```

---

### Response Contract

#### BEFORE (Inconsistent Fallback Schema):
```json
{
  "cluster": "Cardiometabolic Risk Cluster",
  "clusterSeverity": "CRITICAL",
  "diseaseScores": { "heart": 0.35, "diabetes": 0.45 },
  "globalSystemicIndex": 0.38
}
```

#### AFTER (Normalized Production Schema):
```json
{
  "success": true,
  "data": {
    "overall_priority": "EMERGENCY",
    "primary_cluster": "Multi-System Failure / High Cross-Organ Risk",
    "composite_risk_score": 0.5575,
    "detected_clusters": [
      {
        "cluster_id": "multi_system",
        "cluster_name": "Multi-System Failure / High Cross-Organ Risk",
        "priority": "EMERGENCY",
        "specialist": "Internal Medicine / Multi-Disciplinary Panel",
        "description": "Concurrent high risk across multiple vital organ systems.",
        "involved_diseases": ["heart", "diabetes", "liver"]
      },
      {
        "cluster_id": "cardio_metabolic",
        "cluster_name": "Cardio-Metabolic Syndrome",
        "priority": "HIGH",
        "specialist": "Cardiologist & Endocrinologist",
        "involved_diseases": ["heart", "diabetes"]
      }
    ],
    "recommended_specialist": "Internal Medicine / Multi-Disciplinary Panel, Cardiologist & Endocrinologist",
    "radar_chart_data": [
      { "disease": "Cardiovascular (Heart)", "disease_key": "heart", "score": 72.0, "probability": 0.72 },
      { "disease": "Type 2 Diabetes", "disease_key": "diabetes", "score": 68.0, "probability": 0.68 },
      { "disease": "Hepatic (Liver)", "disease_key": "liver", "score": 61.0, "probability": 0.61 },
      { "disease": "Parkinson's Voice", "disease_key": "parkinsons", "score": 22.0, "probability": 0.22 }
    ],
    "scores": {
      "heart": 0.72,
      "diabetes": 0.68,
      "liver": 0.61,
      "parkinsons": 0.22
    },
    "missing_diseases": [],
    "total_evaluated": 4,
    "total_supported": 4,
    "disclaimer": "Experimental ML decision-support summary. This tool analyzes multi-organ risk trajectories across separate disease prediction models to highlight potential syndromic associations and inform clinical review. It does NOT provide a definitive diagnosis or predict medical outcomes."
  }
}
```

---

## 4. Verification & Automated Test Results

The following test suites and production builds were executed:

### Test Suite Execution
```powershell
python manage.py test apps.cross_risk
```
**Results:**
```
Found 10 test(s).
Creating test database for alias 'default'...
..........
----------------------------------------------------------------------
Ran 10 tests in 0.729s

OK
Destroying test database for alias 'default'...
```

| Test Case | Description | Result |
|---|---|---|
| `test_valid_predictions_list` | Serializer parses `{ predictions: [...] }` list | **PASS** |
| `test_valid_legacy_risks_dict` | Serializer normalizes `{ risks: {...} }` dictionary | **PASS** |
| `test_nested_object_inside_risks_dict_resilience` | Serializer handles legacy `{ risks: { heart: { probability: 0.72 } } }` | **PASS** |
| `test_empty_payload_fails_validation` | Empty payload returns validation error | **PASS** |
| `test_invalid_probability_out_of_range` | Probability > 1.0 or < 0.0 rejected | **PASS** |
| `test_all_four_diseases_analysis` | Service computes complete 4-organ syndromic profile | **PASS** |
| `test_partial_disease_no_fabricated_defaults` | Service leaves missing organs as unavailable without fabricating values | **PASS** |
| `test_medical_disclaimer_present` | Service includes explicit experimental disclaimer | **PASS** |
| `test_api_valid_post` | API endpoint returns HTTP 200 with radar data | **PASS** |
| `test_api_invalid_payload` | API endpoint returns HTTP 400 with structured validation details | **PASS** |

### Django System Check
```powershell
python manage.py check
```
**Result:** `System check identified no issues (0 silenced).` — **PASS**

### Frontend Production Build
```powershell
npm run build (Vite 5.4.21)
```
**Output:**
```
✓ 2016 modules transformed.
dist/index.html                              1.30 kB │ gzip:   0.74 kB
dist/assets/index-B7OcfaPz.css              57.02 kB │ gzip:   8.96 kB
dist/assets/index-crG8uku6.js            1,196.86 kB │ gzip: 364.75 kB
✓ built in 13.00s
```
**Result:** **PASS** (Zero JSX, syntax, or bundler errors)

---

## 5. How to Run the Repaired Features Locally

### Backend (Django)
1. Ensure your virtual environment or Python environment is active:
   ```powershell
   cd "multi_disease_prediction_system\multi_disease_prediction_system"
   python manage.py check
   python manage.py runserver 8000
   ```
2. The cross-risk API is accessible at:
   `http://localhost:8000/api/cross-risk/analyze/`

### Frontend (React + Vite)
1. In a separate terminal:
   ```powershell
   cd "multi_disease_prediction_system\multi_disease_prediction_system\frontend"
   npm install
   npm run dev
   ```
2. Navigate in your browser to:
   `http://localhost:5173/cross-risk`

---

## 6. How the Clinical Features Operate

1. **Patient Clinical Profile Mode (Default):**
   * Reads completed predictions stored in `clinical_prediction_history` (`localStorage`).
   * Displays risk levels and probabilities for all completed disease modules (Heart, Diabetes, Liver, Parkinson's).
   * For any unexamined disease, provides a direct "Evaluate" link leading to `/predict/<disease>`.
   * Cross-risk engine only evaluates available data—missing diseases are displayed as "Not Evaluated" on the radar chart and table, preventing clinical misinterpretation.
2. **Interactive Simulation Mode (Demo Controls):**
   * Prominently badged with an amber **Demonstration & Sensitivity Simulation** banner.
   * Allows clinicians and students to manipulate individual sliders (0% to 100%) to test syndromic threshold behaviors (e.g. Cardio-Metabolic Syndrome, MASLD axis, Emergency triage).
   * Generates full radar chart coordinates, cluster descriptions, and specialist referral routing.
