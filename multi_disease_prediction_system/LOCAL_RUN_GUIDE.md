# Local Run & Development Guide

## Multi-Disease Prediction System

This guide walks you through setting up and running both the Django backend and React/Vite frontend locally on Windows, macOS, or Linux.

---

## 1. Prerequisites

- **Python**: 3.10 – 3.14 (Anaconda or standard virtualenv)
- **Node.js**: v18.0.0 or higher
- **Git**

---

## 2. Backend Setup (Django & ML)

### 2.1 Navigate to the Backend Directory
```powershell
# On Windows PowerShell
cd "d:\AI based disease prediction using ml\multi_disease_prediction_system"
```

### 2.2 Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Ensure key environment variables in `.env` are set for local execution:
```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DATABASE_URL=sqlite:///db.sqlite3
MODEL_DIRECTORY=ml/models
```

### 2.3 Install Python Dependencies
```powershell
pip install -r requirements.txt
```
*(Ensure `xgboost`, `shap`, `joblib`, `scikit-learn`, `pandas`, `numpy`, `djangorestframework`, and `django-cors-headers` are installed).*

### 2.4 Run Migrations
```powershell
python manage.py migrate
```

### 2.5 Run System Check & Tests
```powershell
python manage.py check
python manage.py test
```

### 2.6 Start the Django Development Server
```powershell
python manage.py runserver 127.0.0.1:8000
```
Backend API will be accessible at: `http://127.0.0.1:8000/api/`  
Health check endpoint: `http://127.0.0.1:8000/api/health/`

---

## 3. Frontend Setup (React / Vite)

### 3.1 Navigate to the Frontend Directory
Open a new terminal session:
```powershell
cd "d:\AI based disease prediction using ml\multi_disease_prediction_system\frontend"
```

### 3.2 Install NPM Packages
```powershell
npm install
```

### 3.3 Verify Frontend Configuration
The frontend automatically proxies `/api` calls to the Django backend or uses `VITE_API_BASE_URL` defined in `frontend/.env`.
For local development:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3.4 Start the Vite Development Server
```powershell
npm run dev
```
Open your browser at: `http://localhost:5173`

### 3.5 Build for Production (Verification)
```powershell
npm run build
```

---

## 4. End-to-End Prediction Verification

1. Open `http://localhost:5173`
2. Register a new user account via the Registration modal or log in with existing credentials.
3. Select any disease module (e.g., **Heart Disease**, **Diabetes**, **Parkinson's Disease**, or **Liver Disease**).
4. Fill in or use standard clinical inputs and submit the prediction form.
5. Verify that:
   - Real ML model probabilities are returned (e.g., probability score, risk category).
   - Clinical explainability (SHAP feature importance) is rendered.
   - Prevention guidance and pharmacology information are displayed.
   - The prediction is recorded into your history and dashboard statistics.
