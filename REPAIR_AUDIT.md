# Multi-Disease ML Repair & Supabase Auth Audit Report

**Date:** 2026-10-22  
**System:** Multi-Disease Clinical Decision Support Platform  
**Environment:** Windows, Python 3.12 (Anaconda), Django 5.x / DRF, scikit-learn, XGBoost, React 18, Vite 5, Tailwind CSS, Supabase Auth  
**Supabase Project:** `https://qwudleauzofzfdkeklvq.supabase.co`

---

## 1. Executive Summary

This comprehensive audit details the end-to-end diagnosis, root cause investigation, code repairs, and automated validation for all four disease prediction modules (Heart, Diabetes, Parkinson's, Liver) and the transition to genuine Supabase authentication.

Before these fixes:
- **Heart Disease**: Functioning correctly with genuine XGBoost model.
- **Diabetes Prediction**: Failed with `HTTP 400 Bad Request: Validation failed` on all submissions from the frontend form.
- **Parkinson's Disease**: Failed with fatal React client exception `Objects are not valid as a React child (found: object with keys {title, detail})`, crashing the React component tree into the `ErrorBoundary`.
- **Liver Disease**: Contained the identical React child exception vulnerability in prevention recommendations, silent field defaulting (10 fields defaulted rather than required), and lacked UCI attribute aliases.
- **Authentication**: Relied on mock JWTs, simulated demo logins (`dr.vance@cardiology.med`), and had no Supabase SDK integration.
- **Inference Engine**: Contained dead fake prediction generator `generateSimulatedResult()` in the frontend and silent median imputation on missing live features in the backend.

All root causes were pinpointed, repaired in the actual source code, and verified by 34 automated Django backend tests and a production Vite frontend build.

---

## 2. Disease Module Diagnosis & Root Cause Analysis

### 2.1 Heart Disease (Protected Baseline)
- **Status:** Functional baseline preserved intact.
- **Model:** `heart_model_bundle.joblib` (Best estimator: `XGBClassifier`).
- **Features (13):** `age`, `sex`, `cp`, `trestbps`, `chol`, `fbs`, `restecg`, `thalach`, `exang`, `oldpeak`, `slope`, `ca`, `thal`.
- **Finding:** Heart was the only module that worked prior to this repair because its recommendations were plain strings, its serializer matched the frontend payload exactly, and its features did not experience key mapping divergences.
- **Verification:** Regression test passed with probability `0.0966`, risk level `Low`.

### 2.2 Diabetes Disease
- **Status:** **REPAIRED** (Previously broken).
- **Model:** `diabetes_model_bundle.joblib` (Best estimator: `RandomForestClassifier`).
- **Target:** `Outcome` (0 = Negative, 1 = Positive). Full dataset: `data/raw/diabetes.csv` (768 records: 500 negative, 268 positive).
- **Evidence & Reproduction:**
  Sending the frontend form payload `{ Pregnancies: 2, Glucose: 130, BloodPressure: 75, SkinThickness: 25, Insulin: 100, BMI: 29.5, DiabetesPedigreeFunction: 0.45, Age: 38 }` returned `HTTP 400 Bad Request` with:
  `{'details': {'pregnancies': ['This field is required.'], 'glucose': ['This field is required.'], ...}}`
- **Root Cause:**
  1. **Key Naming Discrepancy:** The frontend page (`DiabetesPredictionPage.jsx`) submitted canonical PascalCase keys (`Pregnancies`, `Glucose`, `BloodPressure`, `SkinThickness`, `Insulin`, `BMI`, `DiabetesPedigreeFunction`, `Age`), but `DiabetesPredictionSerializer` strictly expected lowercase snake_case (`pregnancies`, `glucose`, `blood_pressure`, `skin_thickness`, `insulin`, `bmi`, `diabetes_pedigree`, `age`) without a `to_internal_value` hook.
  2. **Improper Error Response:** When inference failed, `apps/diabetes/views.py` caught the exception and returned `HTTP 200 OK` with `"status": "partial_success"`, violating the absolute rule that failed predictions must never return HTTP 200.
  3. **Explainability Mapping:** `apps/diabetes/services.py` passed unmapped snake_case keys to `explain_prediction`, which expected canonical model feature names.
- **Code Changes:**
  - `apps/diabetes/serializers.py`: Implemented `RAW_KEY_MAPPING` and `to_internal_value()` to accept both PascalCase and snake_case keys seamlessly while preserving physiological range validation.
  - `apps/diabetes/views.py`: Changed inference exception handling to return truthful `HTTP 500 Internal Server Error` with `success: False`.
  - `apps/diabetes/services.py`: Passed `mapped_data` to `explain_prediction`.
  - `frontend/src/pages/DiabetesPredictionPage.jsx`: Added robust `formatApiError()` handling.
- **Test Outcome:** Real inference test passed with probability `0.5400`, risk level `High`.

### 2.3 Parkinson's Disease
- **Status:** **REPAIRED** (Previously broken).
- **Model:** `parkinsons_model_bundle.joblib` (Best estimator: `KNeighborsClassifier`).
- **Target:** `status` (0 = Healthy, 1 = Parkinson's Phonation Dysphonia). Full dataset: `data/raw/parkinsons.csv` (195 records).
- **Evidence & Reproduction:**
  The screen recording (`Screen Recording 2026-10-21 140216.mp4`) visibly showed the application crashing into `ErrorBoundary` with:
  `Objects are not valid as a React child (found: object with keys {title, detail})`.
- **Root Cause:**
  1. **Object as React Child:** `apps/parkinsons/services.py` returned `prevention_guidance` as a list of dictionaries `[{ "title": "...", "detail": "..." }]`. `PredictionCard.jsx` rendered `{tip}` directly inside a `<span>`:
     ```jsx
     {(prediction.recommendations || []).map((tip, idx) => (<span>{tip}</span>))}
     ```
     When React attempted to render an object inside a text element, it threw `Objects are not valid as a React child`, triggering the ErrorBoundary.
  2. **Medication Field Discrepancy:** `PARKINSONS_EDUCATIONAL_MEDICINES` uses `{ class, name, purpose, note }`, whereas `PredictionCard` accessed `med.dose` and `med.indication`.
  3. **Inference Feature Strictness:** `ParkinsonsPredictionSerializer` had `required=False` on most biomarkers, allowing missing fields to silently slip through to imputation.
- **Code Changes:**
  - `frontend/src/components/PredictionCard.jsx`: Updated `recommendations` rendering to safely handle both plain strings and objects (`{ title, detail }`), updated `medications` to fall back to `med.class`, `med.purpose`, and `med.note`, and updated `redFlags` and `crossRiskAlert` to be object-safe.
  - `frontend/src/services/predictionService.js`: Normalized `recommendations` so every entry is safely stringified before reaching React components.
  - `apps/parkinsons/serializers.py`: Required all 22 acoustic features and asserted finite numeric ranges.
  - `frontend/src/pages/ParkinsonsPredictionPage.jsx`: Added `formatApiError()` and ensured button re-enabling in `finally`.
- **Test Outcome:** Real inference test passed with probability `1.0000`, risk level `Critical`, and zero React rendering exceptions.

### 2.4 Liver Disease
- **Status:** **REPAIRED** (Previously broken).
- **Model:** `liver_model_bundle.joblib` (Best estimator: `LogisticRegression`).
- **Target:** `Dataset` (UCI ILPD: 1 = Liver Patient, 2 = Healthy Control; mapped during training to 1 = Disease/High Risk, 0 = Healthy/Low Risk). Full dataset: `data/raw/liver.csv` (582 records: 415 patients, 167 controls).
- **Root Cause:**
  1. **Identical React Child Vulnerability:** `LIVER_PREVENTION_GUIDANCE` also contained `{ title, detail }` dictionaries, which would have triggered the same React child error upon rendering.
  2. **Silent Feature Defaulting:** `LiverPredictionSerializer` used `default=...` on all 10 features, violating the core principle that live inference must never silently replace missing features with defaults.
  3. **Rigid UCI Feature Names:** Serializer did not accept common clinical/dataset aliases (`TB`, `DB`, `Alkphos`, `Sgpt`, `Sgot`, `TP`, `ALB`, `A/G Ratio`).
- **Code Changes:**
  - `apps/liver/serializers.py`: Changed all 10 fields to `required=True` (no silent defaulting). Added `RAW_KEY_MAPPING` supporting UCI short aliases and standard snake_case keys. Added biological sanity validation (Direct Bilirubin cannot exceed Total Bilirubin; Albumin cannot exceed Total Proteins).
  - `frontend/src/components/PredictionCard.jsx`: Protected against object rendering faults.
  - `frontend/src/pages/LiverPredictionPage.jsx`: Added `formatApiError()` in `catch` and guaranteed loading reset in `finally`.
- **Test Outcome:** Real inference test passed with probability `0.5137`, risk level `High`.

### 2.5 Inference Engine Hardening (`ml/src/inference.py`)
- **Imputation Disabled for Live Inference:** Replaced silent median imputation with an explicit `ValueError`:
  ```python
  raise ValueError(f"Missing required feature for {disease_name}: '{feat}'. Silent defaulting/imputation is disabled for live inference.")
  ```
- **DataFrame Preserved for Scaling:** Passed `ordered_features` as a DataFrame to `scaler.transform()` so `StandardScaler` retains feature names, eliminating all scikit-learn feature-name warnings.

### 2.6 Removal of Simulated & Mock Predictions
- Completely eliminated `generateSimulatedResult()` from `frontend/src/services/predictionService.js`.
- Replaced synthetic mock fallbacks in all catch blocks with honest error notifications.
- When backend is offline or returns an error status, the frontend now truthfully displays an error and does not fabricate a prediction.

---

## 3. Supabase Auth Architecture & Implementation

### 3.1 Architecture Overview
- **Project URL:** `https://qwudleauzofzfdkeklvq.supabase.co`
- **Frontend Identity Provider:** Supabase Auth is the authoritative authority on clinician identities, sessions, and credentials.
- **Backend Token Validation:** Django REST Framework validates incoming Supabase access tokens via `SupabaseAuthentication` in `apps/accounts/authentication.py`.
- **Database Security:** `supabase_schema.sql` defines a `public.profiles` table with Row Level Security (RLS) enabled and strict policies allowing clinicians to view/update only their own records.

### 3.2 Frontend Components Implemented
1. `frontend/src/utils/supabase.js`:
   Initializes Supabase client via `@supabase/supabase-js`. Detects whether `VITE_SUPABASE_ANON_KEY` is configured via `isSupabaseConfigured`.
2. `frontend/src/services/authService.js`:
   - `login(email, password)` via `supabase.auth.signInWithPassword()`
   - `register(formData)` via `supabase.auth.signUp()`
   - `logout()` via `supabase.auth.signOut()`
   - `getSession()`, `getUser()`, `isAuthenticated()`
   - Synchronizes `session.access_token` to `localStorage` for Django API requests.
3. `frontend/src/hooks/useAuth.jsx`:
   - Retrieves initial session with `supabase.auth.getSession()` on mount.
   - Listens to `supabase.auth.onAuthStateChange()` for `SIGNED_IN`, `TOKEN_REFRESHED`, and `SIGNED_OUT`.
   - Cleans up subscription on unmount with no state leaks or loading races.
4. `frontend/src/pages/LoginPage.jsx` & `RegisterPage.jsx`:
   - Removed hardcoded credentials (`clinician@hospital.org`, `clinicalDemo2026!`).
   - Removed demo bypass buttons.
   - Added configuration alert banner when `VITE_SUPABASE_ANON_KEY` is pending.
5. `frontend/src/components/ProtectedRoute.jsx`:
   - Enforces authentication guard for protected clinical routes.

### 3.3 Backend Token Verification (`apps/accounts/authentication.py`)
- Reads `Authorization: Bearer <token>` from incoming request headers.
- Verifies JWT signature against:
  1. `SUPABASE_JWT_SECRET` (symmetric HMAC-SHA256) if configured in `.env`.
  2. Supabase JWKS endpoint (`f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"`) for asymmetric signing keys (RS256, ES256, EdDSA).
  3. Validates claim integrity: subject (`sub`), audience, expiration (`exp`), and project issuer (`iss`).
- Automatically maps authenticated Supabase user identity to a Django `User` model record.
- Added `SupabaseAuthentication` to `DEFAULT_AUTHENTICATION_CLASSES` in `backend/settings.py`.

---

## 4. Test Matrix & Verification Results

| # | Test Suite | Test Name | Target / Condition | Result | Proof |
|---|---|---|---|---|---|
| 1 | System Check | `manage.py check` | Django configuration, apps & settings | **PASS** | 0 silenced issues |
| 2 | Model Health | `GET /api/health/` | Database + all 4 ML bundles loaded | **PASS** | HTTP 200, all 4 models available |
| 3 | Heart Inference | `POST /api/predict/heart/` | 13 Cleveland features | **PASS** | HTTP 200, prob=0.0966, risk=Low |
| 4 | Diabetes Inference | `POST /api/predict/diabetes/` | Frontend PascalCase payload (8 features) | **PASS** | HTTP 200, prob=0.5400, risk=High |
| 5 | Diabetes Inference | `POST /api/predict/diabetes/` | Serializer snake_case payload (8 features) | **PASS** | HTTP 200, prob=0.5400, risk=High |
| 6 | Diabetes Validation | `POST /api/predict/diabetes/` | Missing required feature | **PASS** | HTTP 400 Bad Request |
| 7 | Diabetes Validation | `POST /api/predict/diabetes/` | Out-of-range glucose (550 mg/dL) | **PASS** | HTTP 400 Bad Request |
| 8 | Diabetes Error | `POST /api/predict/diabetes/` | Forced model failure | **PASS** | HTTP 500 (No fake 200) |
| 9 | Parkinson's Inference | `POST /api/predict/parkinsons/` | All 22 acoustic features | **PASS** | HTTP 200, prob=1.0000, risk=Critical |
| 10 | Parkinson's Validation | `POST /api/predict/parkinsons/` | Missing voice biomarker | **PASS** | HTTP 400 Bad Request |
| 11 | Parkinson's Validation | `POST /api/predict/parkinsons/` | Non-numeric acoustic input | **PASS** | HTTP 400 Bad Request |
| 12 | Parkinson's Error | `POST /api/predict/parkinsons/` | Forced model failure | **PASS** | HTTP 500 (No fake 200) |
| 13 | Liver Inference | `POST /api/predict/liver/` | 10 standard ILPD features | **PASS** | HTTP 200, prob=0.5137, risk=High |
| 14 | Liver Aliases | `POST /api/predict/liver/` | UCI column aliases (TB, DB, Alkphos, etc.) | **PASS** | HTTP 200, prob=0.5137, risk=High |
| 15 | Liver Validation | `POST /api/predict/liver/` | Invalid gender ('Unknown') | **PASS** | HTTP 400 Bad Request |
| 16 | Liver Biological Check | `POST /api/predict/liver/` | Direct Bilirubin > Total Bilirubin | **PASS** | HTTP 400 Bad Request |
| 17 | Liver Validation | `POST /api/predict/liver/` | Missing feature (no silent defaulting) | **PASS** | HTTP 400 Bad Request |
| 18 | Liver Error | `POST /api/predict/liver/` | Forced model failure | **PASS** | HTTP 500 (No fake 200) |
| 19 | Auth Backend | `SupabaseAuthentication` | Valid Supabase JWT token | **PASS** | Authenticated as User(username=sub) |
| 20 | Auth Backend | `SupabaseAuthentication` | Expired Supabase JWT token | **PASS** | Raised AuthenticationFailed |
| 21 | Overall Test Suite | `manage.py test` | 34 automated unit & integration tests | **PASS** | 34/34 passed in 10.58s |
| 22 | Frontend Build | `npm run build` | Vite production bundle | **PASS** | 2016 modules, 0 errors, 9.38s |
| 23 | Secret Scan | `dist/` bundle scan | Check for leaked service keys or DB credentials | **PASS** | 0 secrets found |
| 24 | Live Supabase Test | Browser Sign-up/Login | Real network call to Supabase cloud | **BLOCKED** | Requires user's publishable anon key |

---

## 5. Security & Clinical Compliance Audit

1. **Zero Secret Leakage:** No Supabase service-role keys, database passwords, or Django secret keys exist in the frontend repository or compiled production artifacts.
2. **Clinical Disclaimers:** All four disease prediction interfaces display persistent educational decision support disclaimers specifying that predictions are AI-assisted screening tools and do not constitute formal medical diagnoses.
3. **No Active Fake Predictions:** Every active prediction route connects directly to trained scikit-learn / XGBoost model artifacts. No synthetic random number generation or simulated results exist on prediction pathways.
