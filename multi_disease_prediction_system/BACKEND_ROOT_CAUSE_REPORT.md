# Backend Root Cause Report

## Multi-Disease Prediction System — Comprehensive Diagnosis

---

## 1. Executive Summary

The Django REST backend was non-functional due to **five distinct root cause categories**: hardcoded Windows paths, missing Python dependencies, broken feature-name mappings between API serializers and ML model bundles, missing Django apps in `INSTALLED_APPS`, and frontend service modules that fell back to simulated results when API calls failed.

All issues have been identified, fixed, tested, and committed.

---

## 2. Root Causes (Priority Order)

### RC-1: Hardcoded Absolute Windows Paths (CRITICAL)

**Files affected:**
- `ml/config/model_config.yaml`
- `ml/src/data_ingestion.py`
- `ml/src/inference.py`
- `ml/src/evaluate_models.py`
- `ml/src/train_models.py`
- `ml/src/report_generator.py`

**Problem:** All path references used `D:/AI based disease prediction using ml/...` as hardcoded strings. This broke the backend on any machine with a different install path and prevented deployment to Render/Netlify.

**Fix:** Replaced all hardcoded paths with dynamic `pathlib.Path` + `get_project_root()` function that walks up from the current file to find the project root.

---

### RC-2: Parkinson's Feature Name Mismatch (CRITICAL — Silent Data Corruption)

**Files affected:**
- `apps/parkinsons/services.py`

**Problem:** The Parkinson's serializer normalises raw dataset column names to Python-safe API keys:
- `MDVP:Fo(Hz)` → `mdvp_fo`
- `MDVP:Fhi(Hz)` → `mdvp_fhi`
- `MDVP:Flo(Hz)` → `mdvp_flo`
- `MDVP:Jitter(%)` → `mdvp_jitter_percent`
- (and 18 more)

The inference engine's generic normaliser (strip `_:()%` then lowercase) produces **different normalised forms** for each side:
- API key `mdvp_fo` → `mdvpfo`
- Bundle feature `MDVP:Fo(Hz)` → `mdvpfohz`
- **These don't match** → feature silently gets imputation default value

This meant **4+ of 22 features** were replaced with median imputation values during inference, producing predictions based on incomplete real input. The model still returned a result (no error raised), so this was a **silent accuracy degradation**.

**Fix:** Added `API_TO_MODEL_FEATURE_MAP` dictionary in `apps/parkinsons/services.py` that explicitly maps all 22 API keys to their exact model-bundle feature names. Added `_remap_to_model_keys()` method called before any ML pipeline call.

---

### RC-3: Missing `xgboost` Dependency

**Problem:** The heart disease model bundle's best model is `XGBClassifier`, but `xgboost` was not in `requirements.txt`. Loading the bundle raised `ModuleNotFoundError`.

**Fix:** Added `xgboost` to `requirements.txt` and installed it.

---

### RC-4: Missing `token_blacklist` in INSTALLED_APPS

**Files affected:** `backend/settings.py`

**Problem:** `rest_framework_simplejwt.token_blacklist` was not listed in `INSTALLED_APPS`, causing JWT token blacklisting (logout) to fail with migration errors.

**Fix:** Added the app to `INSTALLED_APPS` and ran migrations.

---

### RC-5: Frontend Simulated/Mock Prediction Fallbacks

**Files affected:**
- `frontend/src/services/*.js`
- `frontend/src/utils/api.js`

**Problem:** When API calls failed (which they always did due to RC-1 through RC-4), frontend service modules contained `generateSimulatedResult()` functions that fabricated prediction results with random probabilities. Users saw plausible-looking results that were entirely fake.

Additionally, `api.js` had a syntax error in the 401 interceptor (missing `try` keyword) that caused all authenticated requests to crash silently.

**Fix:** Removed all `generateSimulatedResult` functions. Fixed the `try` block in `api.js`. Updated all API service routes to correct endpoints.

---

### RC-6: Diabetes Feature Mapping (Already Handled)

**Files affected:** `apps/diabetes/services.py`

**Status:** The diabetes service already had explicit mapping at lines 86-95 (`diabetes_pedigree` → `DiabetesPedigreeFunction`, `blood_pressure` → `BloodPressure`, etc.). No fix needed.

---

### RC-7: Liver Gender Encoding

**Files affected:** `ml/config/model_config.yaml`, `ml/src/data_cleaning.py`

**Status:** The liver serializer uses exact bundle feature names (`Age`, `Gender`, `Total_Bilirubin`, etc.). The `DataCleaner.transform()` handles Gender string→numeric encoding via `category_encodings` config (`Male→1`, `Female→0`). Verified working correctly.

---

## 3. Secondary Issues Found and Fixed

| Issue | File(s) | Fix |
|-------|---------|-----|
| `STATICFILES_DIRS` pointed to nonexistent dir | `backend/settings.py` | Guarded with `os.path.exists()` |
| CORS not configured for Render deployment | `backend/settings.py` | Dynamic CORS from `RENDER_EXTERNAL_HOSTNAME` env var |
| Login serializer didn't support email+username | `apps/accounts/serializers.py` | Updated `LoginSerializer` |
| JWT response shape inconsistent | `apps/accounts/views.py` | Normalised to `{access, refresh, tokens}` |
| `ModelEvaluationView` missing response keys | `apps/dashboard/views.py` | Added `models`, `success`, `data` keys |
| Cross-risk serializer rigid key names | `apps/cross_risk/serializers.py` | Accept both `risks`/`predictions` |
| Data quality serializer rigid key names | `apps/data_quality/serializers.py` | Accept both `disease`/`disease_type` |
| What-if serializer rigid key names | `apps/what_if/serializers.py` | Accept both naming conventions |
| Health check endpoint missing | `apps/dashboard/views.py`, `urls.py` | Created `/api/health/` endpoint |
| Fake fallback probabilities in Parkinson's service | `apps/parkinsons/services.py` | Removed; raises exception instead |
| Fake fallback probabilities in Liver service | `apps/liver/services.py` | Removed; raises exception instead |

---

## 4. Model Artifact Status

All 4 model bundles load and produce correct predictions:

| Disease | Bundle File | Best Model | Features | Status |
|---------|------------|------------|----------|--------|
| Heart | `heart_model_bundle.joblib` | XGBoost | 13 | Working |
| Diabetes | `diabetes_model_bundle.joblib` | RandomForest | 8 | Working |
| Parkinson's | `parkinsons_model_bundle.joblib` | KNN | 22 | Working (after mapping fix) |
| Liver | `liver_model_bundle.joblib` | LogisticRegression | 10 | Working |

> **Note:** Bundles were trained with scikit-learn 1.4.2; current environment has 1.9.1. This produces `InconsistentVersionWarning` but does not affect functionality. For production, retraining with the current sklearn version is recommended.

---

## 5. Verification

| Test | Result |
|------|--------|
| `python manage.py check` | 0 issues |
| `python manage.py test` | 19/19 PASS |
| Heart smoke test | PASS (prob=0.0966, risk=Low) |
| Diabetes smoke test | PASS (prob=0.96, risk=Critical) |
| Parkinson's smoke test | PASS (prob=1.0, risk=Critical, 22/22 features mapped) |
| Liver smoke test | PASS (prob=0.432, risk=Moderate) |
| `npm run build` | PASS (1972 modules, 9.10s) |
