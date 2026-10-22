# Backend API Contract & Endpoint Reference

## Multi-Disease Prediction System

This document provides the complete API specification for authentication, prediction services, clinical decision support tools, and system health checks.

Base URL (Local): `http://127.0.0.1:8000`  
Base URL (Production): `https://<render-service-name>.onrender.com`

---

## 1. System Health

### GET `/api/health/` (or `/health/`)
Check database connection and machine learning model availability.
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "multi-disease-prediction-system",
  "database": "connected",
  "models": {
    "heart": { "status": "available", "model": "XGBoost", "features_count": 13 },
    "diabetes": { "status": "available", "model": "RandomForest", "features_count": 8 },
    "parkinsons": { "status": "available", "model": "KNN", "features_count": 22 },
    "liver": { "status": "available", "model": "LogisticRegression", "features_count": 10 }
  },
  "timestamp": "2026-10-18T18:00:00.000000"
}
```

---

## 2. Authentication Endpoints

### POST `/api/auth/register/`
Create a new user account.
- **Request Body**:
```json
{
  "username": "dr_smith",
  "email": "drsmith@hospital.org",
  "password": "ClinicalPassword123!",
  "password2": "ClinicalPassword123!",
  "first_name": "John",
  "last_name": "Smith",
  "role": "doctor"
}
```
- **Response `201 Created`**: Returns user profile and JWT tokens (`access`, `refresh`, and `tokens` object).

### POST `/api/auth/login/`
Authenticate using either username or email.
- **Request Body**:
```json
{
  "email": "drsmith@hospital.org",
  "password": "ClinicalPassword123!"
}
```
- **Response `200 OK`**: Returns user details, `access`, and `refresh` tokens.

### POST `/api/auth/token/refresh/`
Renew expired JWT access token.
- **Request Body**:
```json
{ "refresh": "<refresh_token>" }
```
- **Response `200 OK`**:
```json
{ "access": "<new_access_token>" }
```

---

## 3. Disease Prediction Services

All prediction endpoints support both flat biometric payloads or nested `{ inputs: { ... }, patient: { ... } }` payloads.

### POST `/api/predict/heart/`
- **Request Parameters**:
  - `age`: integer (years)
  - `sex`: integer (0 = female, 1 = male)
  - `cp`: integer (1-4)
  - `trestbps`: float (mmHg)
  - `chol`: float (mg/dL)
  - `fbs`: integer (0 or 1)
  - `restecg`: integer (0-2)
  - `thalach`: float (bpm)
  - `exang`: integer (0 or 1)
  - `oldpeak`: float (ST depression)
  - `slope`: integer (1-3)
  - `ca`: float (0-3)
  - `thal`: integer (3, 6, or 7)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "disease_type": "heart",
    "prediction_result": 0,
    "probability": 0.0966,
    "risk_level": "Low",
    "explainability": {
      "top_risk_drivers": [...],
      "top_protective_factors": [...]
    },
    "prevention_guidance": [...],
    "medicine_information": [...]
  },
  "prediction": 0,
  "probability": 0.0966,
  "risk_level": "Low"
}
```

### POST `/api/predict/diabetes/`
- **Request Parameters**: `pregnancies`, `glucose`, `blood_pressure`, `skin_thickness`, `insulin`, `bmi`, `diabetes_pedigree`, `age`.
- **Response `200 OK`**: Returns prediction, probability, risk level, and clinical recommendations.

### POST `/api/predict/parkinsons/`
- **Request Parameters**: 22 voice acoustic parameters (`mdvp_fo`, `mdvp_fhi`, `mdvp_flo`, `mdvp_jitter_percent`, `hnr`, `rpde`, `dfa`, `spread1`, etc.).
- **Response `200 OK`**: Returns dysphonia probability, risk classification, uncertainty score, and medical disclaimers.

### POST `/api/predict/liver/`
- **Request Parameters**: `Age`, `Gender`, `Total_Bilirubin`, `Direct_Bilirubin`, `Alkaline_Phosphotase`, `Alamine_Aminotransferase`, `Aspartate_Aminotransferase`, `Total_Protiens`, `Albumin`, `Albumin_and_Globulin_Ratio`.
- **Response `200 OK`**: Returns hepatic risk score, transaminase red-flag evaluations, and lifestyle guidance.

---

## 4. Clinical Decision Support Tools

### POST `/api/cross-risk/analyze/`
Synthesize multiorgan risk clusters from individual disease assessments.
- **Request Body**:
```json
{
  "risks": {
    "heart": 0.65,
    "diabetes": 0.70
  }
}
```
*(Alternatively accepts `{ "predictions": [ { "disease": "heart", "probability": 0.65 }, ... ] }`)*
- **Response `200 OK`**: Returns syndromic clusters (e.g. Cardio-Metabolic Syndrome), multi-organ radar chart data, and recommended specialist referrals.

### POST `/api/data-quality/check/`
Physiological boundary validation and missing/zero-value detection.
- **Request Body**:
```json
{
  "disease": "heart",
  "inputs": {
    "age": 55,
    "trestbps": 140,
    "chol": 240
  }
}
```
- **Response `200 OK`**: Returns overall quality score (0-100), validity status, and per-feature range audits.

### POST `/api/what-if/simulate/`
Counterfactual lifestyle & biomarker scenario simulation.
- **Request Body**:
```json
{
  "disease": "heart",
  "original": { "age": 55, "sex": 1, "trestbps": 160, "chol": 280, "thalach": 130 },
  "modified": { "age": 55, "sex": 1, "trestbps": 120, "chol": 190, "thalach": 130 }
}
```
- **Response `200 OK`**: Returns baseline vs modified risk probabilities, delta percentage, and ranked individual intervention impacts.
