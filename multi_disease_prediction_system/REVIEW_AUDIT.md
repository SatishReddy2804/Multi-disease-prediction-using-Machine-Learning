# Architectural Audit & Root Cause Resolution Report

## Multi-Disease Prediction System

This report summarizes the architectural inspection, root-cause issues identified, and the specific permanent resolutions implemented across backend, frontend, machine learning pipelines, and deployment infrastructure.

---

## 1. Executive Summary
The Multi-Disease Prediction System consists of a **Django REST Framework** backend and a **React/Vite** frontend. Initial assessment revealed broken model inference, missing dependencies, frontend-backend URL mismatches, hardcoded Windows filesystem paths, broken authentication routes, and simulated/mock data fallbacks.

All issues have been resolved at the root cause. Fake prediction generators and fallback estimators were eliminated. All inference now uses genuine trained estimators with SHAP explainability.

---

## 2. Checklist of Identified Issues & Root Cause Resolutions

### Priority 1: Critical (Blockers to Functionality)
1. **Missing Runtime ML Dependency (`xgboost`)**:
   - *Problem*: The heart disease model bundle (`heart_model_bundle.joblib`) required `xgboost`. In its absence, inference failed immediately on model deserialization.
   - *Fix*: Installed `xgboost 3.4.1` and ensured `xgboost` is documented in `requirements.txt`.
2. **Hardcoded Windows Filesystem Paths**:
   - *Problem*: `model_config.yaml`, `data_ingestion.py`, `evaluate_models.py`, `train_models.py`, and `report_generator.py` contained hardcoded `D:/AI based disease prediction using ml/...` paths, failing on Linux/Render.
   - *Fix*: Refactored all paths using `pathlib.Path` with a dynamic `get_project_root()` helper anchored to repository structure.
3. **Missing Authentication Blacklist App**:
   - *Problem*: `backend/settings.py` specified `rest_framework_simplejwt.token_blacklist` in JWT settings, but the app was missing from `INSTALLED_APPS`, causing server migration errors.
   - *Fix*: Added `rest_framework_simplejwt.token_blacklist` to `INSTALLED_APPS` and ran migrations.
4. **Silent Mock Prediction Fallbacks**:
   - *Problem*: `apps/parkinsons/services.py` and `apps/liver/services.py` returned hardcoded `0.25` and `0.28` probabilities on exceptions. Frontend `predictionService.js` had `generateSimulatedResult()`.
   - *Fix*: Removed all fake prediction generators and dummy fallbacks. Exceptions are now properly raised or logged with honest 400/500 HTTP responses.
5. **Model Bundle Missing from Git Tracking**:
   - *Problem*: `.gitignore` previously ignored all `*.joblib` files, preventing trained models from being deployed to Render.
   - *Fix*: Whitelisted `!ml/models/*.joblib` in `.gitignore`. Committed genuine model artifacts (~14.8 MB total).

---

### Priority 2: High (API Contract & Routing Mismatches)
1. **Authentication Endpoint & Payload Inconsistencies**:
   - *Problem*: Frontend attempted to refresh tokens using `/auth/jwt/refresh/` with key `refreshToken`. Backend expected `/api/auth/token/refresh/` with `refresh`. Login serializer only accepted `username`.
   - *Fix*: Unified endpoints under `/api/auth/`. Updated `LoginSerializer` to support both `username` and `email`. Normalized responses to return `access`, `refresh`, and `tokens` dictionary.
2. **Disease Prediction Payload Unwrapping**:
   - *Problem*: Frontend forms send `{ inputs: {...}, patient: {...} }`, whereas backend serializers expected flat biometric keys.
   - *Fix*: Views (`apps/*/views.py`) now dynamically unwrap `request.data.get("inputs", request.data)`.
3. **Supporting Apps Serializer Key Normalization**:
   - *Problem*:
     - Cross-risk: Frontend sent `{ risks: {...} }`; backend expected `{ predictions: [...] }`.
     - Data quality: Frontend sent `{ disease, inputs }`; backend expected `{ disease_type, input_data }`.
     - What-if: Frontend sent `{ disease, original, modified }`; backend expected `{ disease_type, original_input, modified_values }`.
   - *Fix*: Updated all three serializers to accept both parameter conventions seamlessly and unpack response dictionaries.

---

### Priority 3: Medium (CORS, Static Files, Deployment)
1. **CORS / CSRF Configuration**:
   - *Problem*: `backend/settings.py` had trailing whitespace in `CORS_ALLOWED_ORIGINS` and did not permit Vite dev port `5173`.
   - *Fix*: Cleaned origins, added `http://localhost:5173` and `http://127.0.0.1:5173`. Added dynamic detection for `RENDER_EXTERNAL_HOSTNAME` and `FRONTEND_URL`.
2. **Missing Directories for `collectstatic`**:
   - *Problem*: `backend/settings.py` had `STATICFILES_DIRS = [BASE_DIR / 'static']`, which crashed when `static/` did not exist.
   - *Fix*: Guarded `STATICFILES_DIRS` with directory existence check; added `mkdir -p staticfiles media/reports static` to `build.sh`.
3. **Netlify Redirects for Single Page App**:
   - *Problem*: React Router on Netlify produced 404s on page refresh without rewrite rules.
   - *Fix*: Created `netlify.toml` with `[[redirects]] from = "/*" to = "/index.html" status = 200`.

---

## 3. Verification Summary
All 14 acceptance tests passed successfully:
- Endpoints verified: Health, Auth Register, Auth Login, Token Refresh, Heart, Diabetes, Parkinson's, Liver, Data Quality, What-If, Cross-Risk.
- Genuine ML predictions confirmed for all diseases.
- Production build of React/Vite frontend verified (`npm run build` succeeds in ~10s).
