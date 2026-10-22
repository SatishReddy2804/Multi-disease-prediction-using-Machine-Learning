# Local Run & Verification Guide

**Application:** Multi-Disease Clinical Decision Support Platform  
**Operating System:** Windows PowerShell  
**Backend:** Django 5.x / Django REST Framework / scikit-learn / XGBoost  
**Frontend:** React 18 / Vite 5 / Tailwind CSS / Supabase Auth  

---

## 1. Prerequisites & Environment Check

Open PowerShell and verify Python and Node.js are available:
```powershell
python --version
node --version
npm --version
```

Verify backend and frontend environment files:
- Backend: `.env` (exists in `multi_disease_prediction_system/`)
- Frontend: `frontend/.env` (exists in `multi_disease_prediction_system/frontend/`)

---

## 2. Start the Backend Server

Open a PowerShell terminal:
```powershell
# Navigate to the backend directory
cd "D:\AI based disease prediction using ml\multi_disease_prediction_system"

# Apply any pending migrations
python manage.py migrate

# Start the Django development server on port 8000
python manage.py runserver 127.0.0.1:8000
```
Backend will be available at: `http://localhost:8000`

---

## 3. Start the Frontend Application

Open a second PowerShell terminal:
```powershell
# Navigate to the frontend directory
cd "D:\AI based disease prediction using ml\multi_disease_prediction_system\frontend"

# Start the Vite development server
npm run dev
```
Frontend will be available at: `http://localhost:5173`

---

## 4. Health Check Verification

In PowerShell, verify the backend database and all 4 trained machine learning bundles:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/health/" -Method Get | ConvertTo-Json -Depth 5
```
**Expected Output:**
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
  }
}
```

---

## 5. API Smoke Tests (All 4 Diseases)

### 5.1 Heart Disease Prediction Smoke Test
```powershell
$heartBody = @{
    inputs = @{
        age = 55
        sex = 1
        cp = 3
        trestbps = 130
        chol = 240
        fbs = 0
        restecg = 1
        thalach = 150
        exang = 0
        oldpeak = 1.2
        slope = 2
        ca = 0
        thal = 3
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:8000/api/predict/heart/" -Method Post -Body $heartBody -ContentType "application/json" | ConvertTo-Json -Depth 4
```
**Expected:** `success: true`, `probability: ~0.0966`, `risk_level: "Low"`.

---

### 5.2 Diabetes Disease Prediction Smoke Test
```powershell
$diabetesBody = @{
    inputs = @{
        Pregnancies = 2
        Glucose = 130
        BloodPressure = 75
        SkinThickness = 25
        Insulin = 100
        BMI = 29.5
        DiabetesPedigreeFunction = 0.45
        Age = 38
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:8000/api/predict/diabetes/" -Method Post -Body $diabetesBody -ContentType "application/json" | ConvertTo-Json -Depth 4
```
**Expected:** `success: true`, `probability: ~0.5400`, `risk_level: "High"`.

---

### 5.3 Parkinson's Disease Prediction Smoke Test
```powershell
$parkinsonsBody = @{
    inputs = @{
        "MDVP:Fo(Hz)" = 154.2
        "MDVP:Fhi(Hz)" = 197.1
        "MDVP:Flo(Hz)" = 116.3
        "MDVP:Jitter(%)" = 0.0062
        "MDVP:Jitter(Abs)" = 0.00004
        "MDVP:RAP" = 0.0031
        "MDVP:PPQ" = 0.0034
        "Jitter:DDP" = 0.0093
        "MDVP:Shimmer" = 0.029
        "MDVP:Shimmer(dB)" = 0.28
        "Shimmer:APQ3" = 0.015
        "Shimmer:APQ5" = 0.017
        "MDVP:APQ" = 0.024
        "Shimmer:DDA" = 0.046
        "NHR" = 0.024
        "HNR" = 21.8
        "RPDE" = 0.49
        "DFA" = 0.71
        "spread1" = -5.68
        "spread2" = 0.22
        "D2" = 2.38
        "PPE" = 0.20
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:8000/api/predict/parkinsons/" -Method Post -Body $parkinsonsBody -ContentType "application/json" | ConvertTo-Json -Depth 4
```
**Expected:** `success: true`, `probability: 1.0`, `risk_level: "Critical"`.

---

### 5.4 Liver Disease Prediction Smoke Test
```powershell
$liverBody = @{
    inputs = @{
        Age = 48
        Gender = "Male"
        Total_Bilirubin = 1.2
        Direct_Bilirubin = 0.4
        Alkaline_Phosphotase = 210
        Alamine_Aminotransferase = 45
        Aspartate_Aminotransferase = 55
        Total_Protiens = 6.8
        Albumin = 3.2
        Albumin_and_Globulin_Ratio = 0.9
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:8000/api/predict/liver/" -Method Post -Body $liverBody -ContentType "application/json" | ConvertTo-Json -Depth 4
```
**Expected:** `success: true`, `probability: ~0.5137`, `risk_level: "High"`.

---

## 6. Automated Test Suite Execution

Run the complete 34-test automated suite covering Django system checks, serializers, input validation, real ML inference, error handlers, and Supabase JWT authentication:
```powershell
cd "D:\AI based disease prediction using ml\multi_disease_prediction_system"
python manage.py test
```
**Expected:** `Ran 34 tests in ~10s -- OK`

---

## 7. Frontend Production Build Verification

Verify that the frontend builds cleanly without syntax errors, missing dependencies, or secret leakage:
```powershell
cd "D:\AI based disease prediction using ml\multi_disease_prediction_system\frontend"
npm run build
```
**Expected:** `built in ~9s -- 0 errors`
