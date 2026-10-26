# Multi-Disease Prediction and Clinical Decision Support System Using Machine Learning

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.x-green?logo=django&logoColor=white)
![Django REST Framework](https://img.shields.io/badge/Django%20REST%20Framework-3.14-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-orange?logo=scikit-learn&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-2.0-green)
![React](https://img.shields.io/badge/React-18.2-blue?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.1-purple?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7)
![Netlify](https://img.shields.io/badge/Frontend-Netlify-00C7B7)

> **Repository Reference:** [https://github.com/SatishReddy2804/Multi-disease-prediction-using-Machine-Learning](https://github.com/SatishReddy2804/Multi-disease-prediction-using-Machine-Learning)

---

## Table of Contents

- [Overview](#overview)
- [Why This Project](#why-multi-disease-prediction-and-clinical-decision-support-system)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Project Directory Structure](#project-directory-structure)
- [Disease Prediction Modules](#disease-prediction-modules)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Model Training](#2-model-training)
  - [3. Frontend Setup](#3-frontend-setup)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [Supabase Authentication Setup](#supabase-authentication-setup)
- [Usage Workflows](#usage-workflows)
- [API Reference](#api-reference)
- [Model Evaluation](#model-evaluation)
- [Unique Intelligent Features](#unique-intelligent-features)
- [Render Backend Deployment Guide](#render-backend-deployment-guide)
- [Netlify Frontend Deployment Guide](#netlify-frontend-deployment-guide)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)
- [Medical Disclaimer](#medical-disclaimer)
- [Future Scope](#future-scope)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The **Multi-Disease Prediction and Clinical Decision Support System** is an end-to-end, production-grade clinical AI platform engineered to assist healthcare professionals and medical researchers in multi-organ pathology screening. Traditional machine learning healthcare demonstrators frequently operate in isolation—focusing exclusively on single pathologies, utilizing unverified hard-coded probabilities, or functioning as opaque black boxes without decision justification or input boundary validation.

This platform bridges that gap by integrating four dedicated machine learning diagnostic pipelines:
1. **Heart Disease** (UCI Cleveland Dataset)
2. **Diabetes** (Pima Indians Diabetes Database)
3. **Parkinson’s Disease** (Oxford / UCI Biomedical Voice Measurements)
4. **Liver Disease** (Indian Liver Patient Dataset - ILPD)

### How It Works
1. **Clinical Data Intake**: Users provide patient diagnostics manually through responsive forms or upload multi-record CSV files for batch screening.
2. **Pre-Inference Data Integrity Gate**: A specialized Data Quality Engine evaluates input completeness, physiological boundary plausibility, and anomalies, issuing a confidence trust score (0–100%) before model execution.
3. **Multi-Model Inference Pipeline**: Inputs are preprocessed via robust imputers, categorical encoders, and standardizers, then evaluated by tuned champion classification models (`predict_proba()`) to derive genuine risk probabilities.
4. **Clinical Decision Intelligence**: The raw prediction is enriched with:
   - **Explainable AI (XAI)**: SHAP-based and Tree-Feature-Importance factor attribution.
   - **Uncertainty-Aware Shield**: Tree-vote variance, distance-to-distribution metrics, and Out-of-Distribution (OOD) flagging.
   - **Clinical Triage Alerts**: Real-time rule-based red-flag detection prioritizing critical physiological markers.
   - **Counterfactual What-If Risk Simulation**: Dynamic modifiable biomarker scenario analysis.
   - **Cross-Disease Syndromic Analysis**: Multi-module comorbidity pattern detection.
   - **Clinician-Ready PDF Reporting**: Exportable, publication-standard diagnostic case briefs generated via ReportLab.

> **Medical Disclaimer:**
> "This system is an educational decision-support tool. It does not provide a confirmed medical diagnosis. Always consult a qualified doctor for diagnosis, treatment, or medication decisions."

---

## Why Multi-Disease Prediction and Clinical Decision Support System

| Limitation of Existing Tools | Solution in This Platform |
| :--- | :--- |
| **Isolated Disease Focus**: Most systems only predict a single condition (e.g., heart disease alone). | **Unified Clinical Suite**: Predicts 4 distinct diseases under a standardized interface with shared user history. |
| **Opaque Black-Box Outputs**: Binary (0/1) classifications without risk confidence or feature weighting. | **Explainable Probability**: Yields continuous calibrated probabilities (0–100%), risk categorizations, and SHAP/tree attribution charts. |
| **No Input Anomaly Safeguards**: Flawed, missing, or physiologically impossible inputs produce false predictions. | **Uncertainty Shield & Data Quality Gate**: Validates data completeness, identifies anomalous values via Isolation Forests, and suppresses unreliable predictions. |
| **Static Non-Actionable Results**: Predictions offer no insight into preventative steps or lifestyle modifiability. | **Counterfactual What-If Simulator**: Enables clinicians and patients to simulate risk trajectory changes by altering modifiable biomarkers. |
| **Ignoring Comorbidity Clusters**: Failure to recognize that metabolic conditions influence cardiorespiratory and hepatic risks. | **Multi-Disease Cross-Risk Engine**: Evaluates cross-module patterns (e.g., Metabolic Syndrome, Cardio-Metabolic risk) using comorbidity clustering. |
| **Unverified Model Metrics**: Academic papers and GitHub repos often claim fabricated 98%+ accuracies. | **Rigorous Honest Validation**: 5-fold stratified cross-validation on held-out test splits with exact reported test metrics (e.g., 90.16% Heart, 92.31% Parkinson's). |
| **Lack of Formal Clinical Documentation**: Outputs are trapped inside web consoles. | **Clinician-Ready PDF Summaries**: Generates one-page standardized clinical reports with unique Report IDs, triage findings, and disclaimers. |

---

## Key Features

- **Multi-Disease Diagnostic Center**:
  - **Heart Disease**: Evaluates resting hemodynamics, ECG patterns, and fluoroscopy vessels (`/api/predict/heart/`).
  - **Diabetes**: Evaluates metabolic metrics including insulin, postprandial glucose, and BMI (`/api/predict/diabetes/`).
  - **Parkinson's Disease**: Analyzes 22 biomedical voice dysphonia biomarkers (`/api/predict/parkinsons/`).
  - **Liver Disease**: Assesses hepatic enzymes, bilirubin fractions, and protein ratios (`/api/predict/liver/`).
- **Data Quality & Trust Scoring**: Evaluates input completeness and physiologically admissible ranges. Rejects or warns if quality drops below clinical safety thresholds (`/api/data-quality/check/`).
- **Uncertainty-Aware Prediction Shield**: Computes tree-vote variance and Isolation Forest anomaly distance to classify predictions as `RELIABLE`, `UNCERTAIN`, `OUT-OF-DISTRIBUTION`, or `CRITICAL RED FLAG`.
- **Explainable AI (XAI)**: Generates feature contribution breakdowns identifying the primary positive and negative drivers of each diagnostic inference.
- **Emergency Red-Flag Clinical Triage**: Rule-based immediate safety net identifying critical thresholds (e.g., systolic BP > 180 mmHg, glucose > 250 mg/dL, AST/ALT > 500 U/L) (`/api/triage/priority/`).
- **Counterfactual What-If Risk Simulator**: Interactive sandbox that isolates modifiable risk factors (e.g., glucose, BMI, cholesterol) to show before-and-after risk reduction curves (`/api/what-if/simulate/`).
- **Multi-Disease Cross-Risk Comorbidity Engine**: Synthesizes multi-module results into syndromic clusters (Metabolic, Cardio-Metabolic, Liver-Metabolic, Multi-System) with interactive Radar Charts (`/api/cross-risk/analyze/`).
- **Automated PDF Case Brief Generation**: Generates downloadable ReportLab PDFs incorporating patient references, feature attributions, triage alerts, and medical guidance (`/api/reports/generate/`).
- **Batch CSV Diagnostic Screening**: Bulk CSV evaluation supporting large cohort screenings with downloadable results (`ml.src.batch_prediction`).
- **Live Model Evaluation Dashboard**: Real-time rendering of test ROC curves, confusion matrices, and metrics directly from verified evaluation artifacts (`/api/model-evaluation/`).
- **Enterprise Security & Architecture**: JWT authentication with refresh token rotation (`/api/auth/`), CORS configuration, and stateless REST design.

---

## System Architecture

The system utilizes a 3-tier, decoupled micro-architecture combining a high-performance Django REST Framework API with a modern React SPA and an isolated Python machine learning inference layer.

### High-Level System Architecture

```mermaid
flowchart TD
    A[Clinician / User] --> B[Netlify React 18 + Vite SPA]
    B --> C[Render Django REST Framework Backend]
    C --> D[Authentication & JWT Service]
    C --> E[Data Quality & Validation Gate]
    C --> F[ML Prediction Services]
    C --> G[PostgreSQL / SQLite Database]
    F --> H[Trained ML Model Bundles .joblib]
    F --> I[Isolation Forest & Uncertainty Shield]
    F --> J[Explainability Engine XAI]
    F --> K[Clinical Triage Red-Flag Service]
    F --> L[What-If Counterfactual Simulator]
    F --> M[Cross-Disease Comorbidity Engine]
    C --> N[ReportLab PDF Engine]
    N --> O[Media / Reports Repository]
```

### Disease Prediction Workflow

```mermaid
flowchart TD
    A[User Selects Disease Module] --> B[Enter Clinical Values or Upload CSV]
    B --> C[Django Serializer Validation]
    C --> D[Data Quality Engine Check]
    D -- Score < 60% & Non-Critical --> E[Halt: Return Data Quality Warning]
    D -- Score >= 60% or Emergency --> F[Extract Saved Cleaner & Scaler]
    F --> G[Execute Trained ML Model Inference]
    G --> H[Derive Predicted Class & Raw Probability]
    H --> I[Uncertainty & Out-of-Distribution Shield]
    H --> J[Explainability Feature Attribution]
    H --> K[Evaluate Emergency Clinical Red Flags]
    K --> L[Generate Prevention & Medicine Guidance]
    L --> M[Persist Record to PredictionHistory Database]
    M --> N[Return Comprehensive JSON Response to Client]
    N --> O[Clinician May Launch What-If Simulator]
    N --> P[Clinician May Download PDF Case Report]
```

### Deployment Architecture

```mermaid
flowchart LR
    subgraph Client["Client Tier (Netlify)"]
        UI[React 18 + Vite SPA<br/>Tailwind CSS Dashboard]
    end
    
    subgraph Backend["Application Tier (Render Web Service)"]
        GUNICORN[Gunicorn + Uvicorn Workers]
        DJANGO[Django 5.x REST API]
        ML[ML Inference Pipelines<br/>Cached Singleton Registry]
        PDF[ReportLab PDF Generator]
    end
    
    subgraph DataTier["Data Tier (Render Managed)"]
        DB[(PostgreSQL 16 Database)]
        MODELS[Serialized Joblib Bundles]
    end

    UI -- HTTPS / JSON REST --> GUNICORN
    GUNICORN --> DJANGO
    DJANGO --> ML
    DJANGO --> PDF
    ML --> MODELS
    DJANGO --> DB
```

---

---

## Project Directory Structure

### Architecture & Component Map (Mermaid)

```mermaid
graph TD
    Root["Multi-disease-prediction-using-Machine-Learning/"]
    Root --> MDPS["multi_disease_prediction_system/"]
    
    subgraph DjangoApps ["Django Applications (apps/)"]
        MDPS --> Apps["apps/"]
        Apps --> A1["accounts/ (Supabase Auth and JWT)"]
        Apps --> A2["heart/ (Heart Disease Module)"]
        Apps --> A3["diabetes/ (Diabetes Module)"]
        Apps --> A4["parkinsons/ (Parkinsons 22 Voice Biomarkers)"]
        Apps --> A5["liver/ (Liver Disease Module)"]
        Apps --> A6["dashboard/ (Analytics and Health Check)"]
        Apps --> A7["cross_risk/ (Comorbidity Engine)"]
        Apps --> A8["data_quality/ (Validation and Outlier Guard)"]
        Apps --> A9["reports/ (PDF Report Generation)"]
        Apps --> A10["triage/ (Emergency Red-Flag Alerts)"]
        Apps --> A11["uncertainty/ (OOD and Confidence Shield)"]
        Apps --> A12["what_if/ (Counterfactual Simulator)"]
    end

    subgraph BackendCore ["Django Core (backend/)"]
        MDPS --> Backend["backend/"]
        Backend --> B1["settings.py (CORS, WhiteNoise, DB)"]
        Backend --> B2["urls.py (Master API and health Router)"]
        Backend --> B3["wsgi.py and asgi.py (Production Entrypoints)"]
    end

    subgraph MLSubsystem ["Machine Learning Engine (ml/)"]
        MDPS --> ML["ml/"]
        ML --> ML1["models/ (Trained .joblib Model Bundles)"]
        ML --> ML2["src/ (Inference, Cleaning, Explainability, XAI)"]
        ML --> ML3["config/ (model_config.yaml Thresholds)"]
    end

    subgraph CanonicalData ["Clinical Datasets (data/)"]
        MDPS --> Data["data/raw/"]
        Data --> D1["heart.csv, diabetes.csv, parkinsons.csv, liver.csv"]
    end

    subgraph ReactFrontend ["React 18 + Vite SPA (frontend/)"]
        MDPS --> Frontend["frontend/"]
        Frontend --> F1["src/components/ (Prediction, Result and Risk UI)"]
        Frontend --> F2["src/pages/ (Disease Prediction and Dashboard Views)"]
        Frontend --> F3["src/services/ (api.js Central Axios Client)"]
        Frontend --> F4["src/context/ (AuthContext.jsx Supabase Session)"]
        Frontend --> F5["vite.config.js and tailwind.config.js"]
    end

    subgraph DevOps ["DevOps and Cloud Deployment"]
        MDPS --> C1["Dockerfile (Render Production Container)"]
        MDPS --> C2[".dockerignore (Security and Image Optimization)"]
        MDPS --> C3["requirements.txt (Python Dependencies)"]
        MDPS --> C4["build.sh (Static Assets and Migrations Script)"]
        MDPS --> C5["netlify.toml (SPA Rewrites and Scanner Bypass)"]
        MDPS --> C6["supabase_schema.sql (PostgreSQL Schema)"]
    end
```

### Full Repository Tree

```text
Multi-disease-prediction-using-Machine-Learning/
│
└── multi_disease_prediction_system/
    │
    ├── apps/                                  # Django Applications
    │   ├── accounts/                          # User accounts, auth & Supabase JWT authentication
    │   │   ├── migrations/
    │   │   ├── authentication.py              # SupabaseAuthentication class
    │   │   ├── models.py
    │   │   ├── serializers.py
    │   │   ├── urls.py
    │   │   ├── utils.py
    │   │   └── views.py
    │   │
    │   ├── heart/                             # Heart Disease Prediction module
    │   │   ├── models.py, serializers.py, services.py, urls.py, views.py
    │   │
    │   ├── diabetes/                          # Diabetes Prediction module
    │   │   ├── models.py, serializers.py, services.py, urls.py, views.py
    │   │
    │   ├── parkinsons/                        # Parkinson's Prediction module (22 voice biomarkers)
    │   │   ├── models.py, serializers.py, services.py, urls.py, views.py
    │   │
    │   ├── liver/                             # Liver Disease Prediction module
    │   │   ├── models.py, serializers.py, services.py, urls.py, views.py
    │   │
    │   ├── dashboard/                         # Analytics, Prediction History, Health Check
    │   │   ├── models.py, serializers.py, services.py, urls.py, views.py
    │   │
    │   ├── cross_risk/                        # Multi-morbidity cross-risk analysis engine
    │   ├── data_quality/                      # Input validation, outlier detection & scoring
    │   ├── reports/                           # PDF clinical summary report generator
    │   ├── triage/                            # Clinical risk triage recommendation
    │   ├── uncertainty/                       # OOD detection, model agreement & confidence
    │   └── what_if/                           # What-If risk factor simulation engine
    │
    ├── backend/                               # Django Core Configuration
    │   ├── __init__.py
    │   ├── asgi.py                            # ASGI entrypoint
    │   ├── settings.py                        # Django settings (CORS, Supabase, DB, WhiteNoise)
    │   ├── urls.py                            # Main URL router & /health/ endpoints
    │   └── wsgi.py                            # Production WSGI application
    │
    ├── ml/                                    # Machine Learning Core Engine & Models
    │   ├── config/
    │   │   └── model_config.yaml              # ML hyperparameters and threshold configurations
    │   ├── models/                            # Trained Model Bundles & Transformers
    │   │   ├── heart_model_bundle.joblib      # Heart XGBoost pipeline
    │   │   ├── diabetes_model_bundle.joblib   # Diabetes Random Forest pipeline
    │   │   ├── parkinsons_model_bundle.joblib # Parkinson's KNN + scaler bundle
    │   │   ├── liver_model_bundle.joblib      # Liver Logistic Regression bundle
    │   │   └── ... (scalers, cleaners & isolation forests)
    │   └── src/
    │       ├── data_cleaning.py               # Preprocessing pipelines
    │       ├── explainability.py              # SHAP feature importance
    │       ├── inference.py                   # ModelRegistry singleton & prediction runners
    │       └── training.py                    # Training scripts
    │
    ├── data/                                  # Canonical Clinical Datasets
    │   └── raw/
    │       ├── heart.csv
    │       ├── diabetes.csv
    │       ├── parkinsons.csv
    │       └── liver.csv
    │
    ├── frontend/                              # React + Vite Frontend Application
    │   ├── public/
    │   │   └── favicon.svg
    │   ├── src/
    │   │   ├── assets/
    │   │   ├── components/                    # Reusable UI widgets
    │   │   │   ├── common/                    # Navbar, Footer, ProtectedRoute, ErrorBoundary
    │   │   │   ├── dashboard/                 # HistoryTable, StatCards, RiskDistributionChart
    │   │   │   └── prediction/                # PredictionResultCard, MedicineCard, RiskMeter
    │   │   ├── context/
    │   │   │   └── AuthContext.jsx            # Supabase Auth provider & session management
    │   │   ├── hooks/                         # Custom React hooks
    │   │   ├── pages/                         # Main Application Routes
    │   │   │   ├── HomePage.jsx
    │   │   │   ├── LoginPage.jsx
    │   │   │   ├── RegisterPage.jsx
    │   │   │   ├── DashboardPage.jsx
    │   │   │   ├── HeartPredictionPage.jsx
    │   │   │   ├── DiabetesPredictionPage.jsx
    │   │   │   ├── ParkinsonsPredictionPage.jsx
    │   │   │   └── LiverPredictionPage.jsx
    │   │   ├── services/                      # API Client Services
    │   │   │   ├── api.js                     # Central Axios instance with JWT interceptor
    │   │   │   ├── authService.js             # Supabase & backend authentication
    │   │   │   ├── predictionService.js       # Endpoints for all 4 diseases
    │   │   │   ├── crossRiskService.js
    │   │   │   ├── dataQualityService.js
    │   │   │   ├── reportService.js
    │   │   │   └── whatIfService.js
    │   │   ├── utils/
    │   │   ├── App.jsx                        # Main React Router switch
    │   │   ├── index.css                      # Tailwind CSS styles
    │   │   └── main.jsx                       # Application entrypoint
    │   ├── index.html
    │   ├── netlify.toml                       # Netlify SPA redirect rules
    │   ├── package.json                       # Frontend dependencies (React 18, Vite 5, Tailwind)
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   └── vite.config.js                     # Vite build configuration
    │
    ├── media/                                 # Generated PDF reports & static media
    ├── templates/                             # Django HTML templates
    ├── manage.py                              # Django CLI management script
    │
    ├── Dockerfile                             # Render production container definition
    ├── .dockerignore                          # Prevents bloated images and secret leaks
    ├── requirements.txt                       # Backend Python dependencies
    ├── build.sh                               # Render build script (pip, collectstatic, migrate)
    ├── netlify.toml                           # Root Netlify redirect rules
    ├── supabase_schema.sql                    # SQL migration script for Supabase tables
    │
    └── Documentation & Setup Guides:
        ├── DEPLOY_RENDER_NETLIFY.md           # Click-by-click Render + Netlify deployment guide
        ├── DEPLOYMENT_ENV_REFERENCE.md        # Reference table for all environment variables
        ├── DEPLOYMENT_TROUBLESHOOTING.md      # Troubleshooting CORS, 404s, and health checks
        ├── LOCAL_RUN_GUIDE.md                 # Instructions to run locally
        ├── API_CONTRACT.md                    # Backend REST API contracts
        ├── REPAIR_AUDIT.md                    # ML models audit & bugfix report
        └── README.md                          # Project documentation
```

## Disease Prediction Modules

### 1. Heart Disease Module
- **Clinical Focus**: Detection of coronary artery disease and myocardial ischemia.
- **Dataset**: UCI Heart Disease Dataset (Cleveland Clinic Foundation).
- **Source**: [UCI Machine Learning Repository — Heart Disease](https://archive.ics.uci.edu/dataset/45/heart+disease)
- **Sample Count / Features**: 303 clinical records, 13 diagnostic parameters.
- **Input Features**: `age`, `sex`, `cp` (chest pain type), `trestbps` (resting blood pressure), `chol` (serum cholesterol), `fbs` (fasting blood sugar), `restecg` (resting ECG), `thalach` (maximum heart rate achieved), `exang` (exercise-induced angina), `oldpeak` (ST depression), `slope` (peak exercise ST segment), `ca` (major vessels colored by fluoroscopy), `thal` (thallium stress test).
- **Champion Model**: **XGBoost Classifier** (with Random Forest achieving parity).
- **API Endpoint**: `POST /api/predict/heart/`
- **Output**: Binary classification (`0: Absence`, `1: Presence`), Risk Level (`Low`, `Moderate`, `High`, `Critical`), Risk Probability percentage, Uncertainty Badge, Contributing Features, Clinical Red Flags.
- **Measured Test Accuracy**: **90.16%** (ROC-AUC: **0.9416**).

### 2. Diabetes Module
- **Clinical Focus**: Type-2 diabetes risk identification based on metabolic and glycemic markers.
- **Dataset**: Pima Indians Diabetes Database (National Institute of Diabetes and Digestive and Kidney Diseases).
- **Source**: [Kaggle — Pima Indians Diabetes Database](https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database)
- **Sample Count / Features**: 768 patient records, 8 clinical features.
- **Input Features**: `pregnancies`, `glucose` (plasma glucose concentration), `blood_pressure` (diastolic blood pressure), `skin_thickness` (triceps skinfold thickness), `insulin` (2-hour serum insulin), `bmi` (body mass index), `diabetes_pedigree` (pedigree genetic risk score), `age`.
- **Special Preprocessing**: Biologically impossible zero values in Glucose, Blood Pressure, Skin Thickness, Insulin, and BMI are treated as true missing data and imputed via median strategy.
- **Champion Model**: **Random Forest Classifier**.
- **API Endpoint**: `POST /api/predict/diabetes/`
- **Output**: Binary classification (`0: Non-Diabetic`, `1: Diabetic`), Probability Score, Risk Stratification, What-If Modifiability options.
- **Measured Test Accuracy**: **75.32%** (ROC-AUC: **0.8142**).

### 3. Parkinson’s Disease Module
- **Clinical Focus**: Non-invasive phonatory impairment and acoustic dysphonia analysis for Parkinson's screening.
- **Dataset**: Oxford Parkinson's Disease Biomedical Voice Measurement Data Set.
- **Source**: [Kaggle / UCI — Parkinson's Voice Dataset](https://www.kaggle.com/datasets/vikasukani/parkinsons-disease-data-set)
- **Sample Count / Features**: 195 acoustic recordings, 22 continuous voice biomarker features.
- **Input Features**: Fundamental frequency (`MDVP:Fo(Hz)`, `MDVP:Fhi(Hz)`, `MDVP:Flo(Hz)`), Jitter measurements (`MDVP:Jitter(%)`, `MDVP:Jitter(Abs)`, `MDVP:RAP`, `MDVP:PPQ`, `Jitter:DDP`), Shimmer variations (`MDVP:Shimmer`, `MDVP:Shimmer(dB)`, `Shimmer:APQ3`, `Shimmer:APQ5`, `MDVP:APQ`, `Shimmer:DDA`), Harmonic ratios (`NHR`, `HNR`), Non-linear dynamical metrics (`RPDE`, `DFA`, `spread1`, `spread2`, `D2`, `PPE`).
- **Target**: `status` (`0: Healthy`, `1: Parkinson's Disease`). Non-predictive patient `name` strings are stripped prior to training.
- **Champion Model**: **K-Nearest Neighbors (KNN)** (XGBoost also achieved 92.31%).
- **API Endpoint**: `POST /api/predict/parkinsons/`
- **Measured Test Accuracy**: **92.31%** (ROC-AUC: **0.9966**, Precision: **100.0%**).

### 4. Liver Disease Module
- **Clinical Focus**: Evaluation of hepatic impairment, biliary obstruction, and liver inflammation.
- **Dataset**: Indian Liver Patient Dataset (ILPD).
- **Source**: [UCI Machine Learning Repository — ILPD](https://archive.ics.uci.edu/dataset/225/ilpd+indian+liver+patient+dataset)
- **Sample Count / Features**: 583 clinical records, 10 diagnostic indicators.
- **Input Features**: `age`, `gender`, `total_bilirubin`, `direct_bilirubin`, `alkaline_phosphotase`, `alamine_aminotransferase` (ALT), `aspartate_aminotransferase` (AST), `total_protiens`, `albumin`, `albumin_globulin_ratio`.
- **Special Preprocessing**: Target values mapped from `{1: Liver Patient, 2: Healthy}` to standard binary `{1, 0}`. Missing albumin/globulin ratios imputed; gender one-hot encoded.
- **Champion Model**: **Logistic Regression** (Precision: **93.10%**).
- **API Endpoint**: `POST /api/predict/liver/`
- **Measured Test Accuracy**: **72.81%** (ROC-AUC: **0.8114**).

---

## Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | Django / Django REST Framework | 5.2 / 3.18 | Robust RESTful Web API, Serializers, Routing |
| **Language Runtime** | Python | 3.11+ | Primary backend and scientific computing runtime |
| **Database** | PostgreSQL / SQLite | 16 / 3.x | Persistent storage for history, auth, and audits |
| **Authentication** | Supabase Auth / Django REST Framework | Supabase JS 2.x | User registration, login, and bearer-token authentication |
| **Machine Learning** | scikit-learn | 1.4.2 | Preprocessing, pipeline orchestration, tree classifiers |
| **Gradient Boosting** | XGBoost | 2.0+ / 3.2 | High-performance gradient boosted decision trees |
| **Resampling** | Imbalanced-learn | 0.12+ | Synthetic Minority Over-sampling Technique (SMOTE) |
| **Model Explainability** | SHAP / Feature Importances | 0.45+ | Shapley additive feature importance attribution |
| **Anomaly Detection** | Isolation Forest (scikit-learn) | 1.4.2 | Input Out-of-Distribution and anomaly filtering |
| **PDF Generation** | ReportLab | 4.1+ | Programmatic generation of clinical report briefs |
| **Frontend Framework** | React | 18.3.1 | Declarative component UI hierarchy |
| **Build Tool** | Vite | 5.3+ | Next-generation frontend tooling and HMR |
| **Styling & Design** | Tailwind CSS | 3.4.4 | Utility-first responsive clinical design system |
| **Data Visualization** | Chart.js / react-chartjs-2 | 4.4 / 5.2 | Radar charts, ROC curves, feature bar graphs |
| **Icons** | Lucide React | 0.400+ | Lightweight clinical iconography |
| **WSGI / ASGI Servers** | Gunicorn / Uvicorn | 22.0 / 0.29 | Production-grade WSGI/ASGI application servers |
| **Static Serving** | WhiteNoise | 6.6+ | Production static asset streaming for Django |

---

## Getting Started

### Prerequisites
- **Python**: Version 3.11 or higher installed.
- **Node.js**: Version 18.x or higher and **npm** 9.x+.
- **Git**: Version 2.x+.

---

### 1. Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/SatishReddy2804/Multi-disease-prediction-using-Machine-Learning.git
cd multi_disease_prediction_system

# 2. Create and activate a Python virtual environment
python -m venv venv

# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# 3. Upgrade pip and install all production dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env

# 5. Apply database schema migrations
python manage.py makemigrations
python manage.py migrate

# 6. (Optional) Create an administrative superuser
python manage.py createsuperuser

# 7. Start the local Django development server
python manage.py runserver 0.0.0.0:8000
```

The Django REST API will be accessible at `http://127.0.0.1:8000/api/`.

---

### 2. Model Training

All models are trained, tuned via stratified 5-fold cross-validation, and serialized into `ml/models/`. You can retrain any or all models on demand:

```bash
# Train individual disease modules:
python -m ml.src.train_models --disease heart
python -m ml.src.train_models --disease diabetes
python -m ml.src.train_models --disease parkinsons
python -m ml.src.train_models --disease liver

# Or retrain all 4 models sequentially:
python -m ml.src.train_models --disease all

# Run comprehensive evaluation and generate ROC/Confusion figures & metrics.json:
python -m ml.src.evaluate_models --disease all
```

---

### 3. Frontend Setup

In a new terminal window:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install NPM packages
npm install

# 3. Create or inspect the local environment file
cp .env.example .env

# 4. Start the Vite development server
npm run dev
```

The application interface will be live at `http://localhost:5173/`.

---

## Configuration & Environment Variables

### Backend Configuration (`.env`)

| Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| `SECRET_KEY` | Cryptographic key for session & token encryption | `django-insecure-dev-key-...` |
| `DEBUG` | Toggle development debug mode | `True` (Set to `False` in production) |
| `ALLOWED_HOSTS` | Comma-separated list of permitted host headers | `localhost,127.0.0.1,0.0.0.0` |
| `DATABASE_URL` | PostgreSQL or SQLite database URI | `sqlite:///db.sqlite3` |
| `CORS_ALLOWED_ORIGINS` | Permitted origins for Cross-Origin Resource Sharing | `http://localhost:3000,http://localhost:5173` |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF protection | `http://localhost:3000,http://localhost:5173` |
| `MODEL_DIRECTORY` | Absolute or relative path to serialized model joblib files | `ml/models` |
| `DATA_DIRECTORY` | Directory containing raw and processed CSV datasets | `data` |
| `REPORT_DIRECTORY` | Output directory for generated clinical PDF reports | `media/reports` |
| `FRONTEND_URL` | Canonical frontend domain for CORS/redirects | `http://localhost:5173` |
| `BACKEND_URL` | Canonical backend API domain | `http://localhost:8080` |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Validity duration of Django-issued JWT access tokens | `60` |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Validity duration of Django-issued JWT refresh tokens | `7` |
| `SUPABASE_URL` | Supabase project URL used to validate Supabase Auth tokens | Set in `.env.example` |
| `SUPABASE_JWT_SECRET` | Optional signing secret for HMAC-signed Supabase tokens | Leave unset unless required |

### Frontend Configuration (`frontend/.env`)

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base endpoint for the Django REST API | `http://localhost:8000` |
| `VITE_APP_NAME` | Clinical Platform application header title | `Multi-Disease Prediction System` |
| `VITE_APP_ENVIRONMENT` | Active build target environment (`development` / `production`) | `development` |
| `VITE_SUPABASE_URL` | Supabase project URL for browser authentication | Set in `frontend/.env.example` |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key used by the frontend | Obtain from Supabase project API settings |

Copy the example files to `.env` and `frontend/.env` before running the application. Do not put a Supabase service-role key or other private credentials in frontend configuration or commit them to Git.

## Supabase Authentication Setup

The frontend uses Supabase Auth for account registration, sign-in, and persistent sessions. The Django API accepts Supabase bearer tokens and associates authenticated identities with local Django users. For dashboard configuration, redirect URLs, email confirmation options, and the optional profile schema, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md). The SQL for the optional Supabase profile table and row-level security policies is in [supabase_schema.sql](./supabase_schema.sql).

---

## Usage Workflows

```mermaid
flowchart TD
    A[Access Web Interface] --> B[Log In or Continue as Guest]
    B --> C[Select Target Disease Module]
    C --> D[Input Clinical Biomarkers or Upload CSV]
    D --> E[Real-Time Data Quality Scoring Gate]
    E --> F[ML Predictive Inference Execution]
    F --> G[Review Probabilistic Risk & Trust Badge]
    G --> H[Inspect Key Contributing Factors]
    G --> I[Check Emergency Triage Alerts]
    I --> J[Explore What-If Counterfactual Sandbox]
    I --> K[Synthesize Multi-Disease Cross-Risk Radar]
    K --> L[Generate & Download Clinician-Ready PDF]
    L --> M[Record Persisted to Audit History]
```

### Complete End-to-End Walkthrough:
1. **Access**: Navigate to the web portal at `http://localhost:3000/`.
2. **Authentication**: Sign in via `/login` to link diagnostic runs to your clinician profile or utilize direct screening.
3. **Module Selection**: Choose between Heart Disease, Diabetes, Parkinson’s Disease, or Liver Disease from the sidebar.
4. **Biomarker Input**: Enter patient values into the stepped form (e.g., Blood Pressure, Serum Cholesterol, Glucose) or click **Load Sample Patient** for pre-filled clinical vignettes.
5. **Quality Assessment**: The Data Quality Engine runs instantly upon submission, checking for missing values, improbable readings, or severe physiological anomalies.
6. **Inference Execution**: The backend executes the champion model, returning the predicted class (`Normal` vs. `At-Risk`) and risk probability (e.g., `84.2%`).
7. **Trust Badge Inspection**: Examine model confidence, uncertainty levels, and OOD status.
8. **Feature Importance Review**: Interactive bar charts illustrate which biomarkers exerted the strongest influence on the decision.
9. **Emergency Triage Checks**: The triage engine highlights any immediate safety concerns (e.g., critical hypertension or elevated transaminases).
10. **Preventative & Medical Guidance**: View structured lifestyle guidance and educational medication profiles.
11. **Counterfactual Simulation**: Launch the **What-If Simulator** to adjust modifiable parameters (e.g., lowering BMI from 34.0 to 25.5) and immediately observe simulated risk reductions.
12. **Cross-Risk Synthesis**: Run assessments across multiple modules to generate a combined **Multi-Disease Radar Chart** identifying systemic metabolic or cardiovascular clusters.
13. **PDF Export**: Click **Download PDF Report** to produce a clinical summary complete with a unique UUID, timestamp, and visual breakdown.
14. **Audit History**: Review past patient screenings under the **History** tab with full filtering and search support.

---

## API Reference

All requests and responses use standard `application/json`. Authenticated endpoints accept the header: `Authorization: Bearer <access_token>`.

### Authentication Endpoints

#### Register User
- **Method / URL**: `POST /api/auth/register/`
- **Request Body**:
  ```json
  {
    "username": "dr_smith",
    "email": "dr.smith@hospital.org",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Smith"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "message": "User registered successfully",
    "user": { "id": 1, "username": "dr_smith", "email": "dr.smith@hospital.org" }
  }
  ```

#### Login & Obtain JWT
- **Method / URL**: `POST /api/auth/login/`
- **Request Body**:
  ```json
  {
    "username": "dr_smith",
    "password": "SecurePassword123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": { "username": "dr_smith", "email": "dr.smith@hospital.org" }
  }
  ```

---

### Disease Prediction Endpoints

#### Heart Disease Prediction
- **Method / URL**: `POST /api/predict/heart/`
- **Request Body**:
  ```json
  {
    "age": 58,
    "sex": 1,
    "cp": 4,
    "trestbps": 140,
    "chol": 260,
    "fbs": 0,
    "restecg": 1,
    "thalach": 128,
    "exang": 1,
    "oldpeak": 2.2,
    "slope": 2,
    "ca": 2,
    "thal": 7
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "status": "success",
    "disease": "heart",
    "prediction": 1,
    "prediction_label": "Heart Disease Detected",
    "probability": 0.884,
    "risk_level": "High",
    "model_name": "XGBoost",
    "uncertainty": {
      "confidence_level": "High",
      "uncertainty_level": "Low",
      "is_out_of_distribution": false,
      "trust_status": "RELIABLE"
    },
    "data_quality": {
      "quality_score": 100.0,
      "status": "EXCELLENT"
    },
    "triage": {
      "priority": "ROUTINE",
      "red_flags": []
    },
    "key_features": [
      { "feature": "ca", "importance": 0.245 },
      { "feature": "oldpeak", "importance": 0.182 }
    ]
  }
  ```

#### Diabetes Prediction
- **Method / URL**: `POST /api/predict/diabetes/`
- **Request Body**:
  ```json
  {
    "pregnancies": 4,
    "glucose": 156,
    "blood_pressure": 78,
    "skin_thickness": 32,
    "insulin": 180,
    "bmi": 34.2,
    "diabetes_pedigree": 0.65,
    "age": 45
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "status": "success",
    "disease": "diabetes",
    "prediction": 1,
    "prediction_label": "High Risk of Diabetes",
    "probability": 0.762,
    "risk_level": "High",
    "model_name": "RandomForest"
  }
  ```

#### Parkinson’s Disease Prediction
- **Method / URL**: `POST /api/predict/parkinsons/`
- **Request Body**: All 22 voice acoustic parameters (`MDVP:Fo(Hz)`, `MDVP:Jitter(%)`, `HNR`, `RPDE`, `D2`, `PPE`, etc.).
- **Response** (`200 OK`): Prediction status, voice biomarker probability score, and clinical neurology advisory.

#### Liver Disease Prediction
- **Method / URL**: `POST /api/predict/liver/`
- **Request Body**:
  ```json
  {
    "age": 48,
    "gender": "Male",
    "total_bilirubin": 2.4,
    "direct_bilirubin": 1.1,
    "alkaline_phosphotase": 290,
    "alamine_aminotransferase": 64,
    "aspartate_aminotransferase": 88,
    "total_protiens": 6.2,
    "albumin": 3.0,
    "albumin_globulin_ratio": 0.9
  }
  ```
- **Response** (`200 OK`): Hepatic risk stratification, probability, and enzyme contribution analysis.

---

### Intelligence & Simulation Endpoints

#### What-If Counterfactual Simulation
- **Method / URL**: `POST /api/what-if/simulate/`
- **Request Body**:
  ```json
  {
    "disease_type": "diabetes",
    "original_input": {
      "pregnancies": 3, "glucose": 165, "blood_pressure": 82,
      "skin_thickness": 30, "insulin": 160, "bmi": 35.4,
      "diabetes_pedigree": 0.52, "age": 42
    },
    "modified_values": {
      "glucose": 110,
      "bmi": 26.5
    }
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "disease": "diabetes",
    "baseline_probability": 0.812,
    "counterfactual_probability": 0.384,
    "probability_delta": -0.428,
    "risk_reduced": true,
    "ranked_interventions": [
      { "feature": "glucose", "from": 165, "to": 110, "impact": 0.284 },
      { "feature": "bmi", "from": 35.4, "to": 26.5, "impact": 0.144 }
    ],
    "disclaimer": "This simulation is educational only. It does not guarantee clinical outcomes."
  }
  ```

#### Multi-Disease Cross-Risk Analysis
- **Method / URL**: `POST /api/cross-risk/analyze/`
- **Request Body**:
  ```json
  {
    "predictions": [
      { "disease_type": "heart", "probability": 0.78, "prediction": 1 },
      { "disease_type": "diabetes", "probability": 0.82, "prediction": 1 },
      { "disease_type": "liver", "probability": 0.65, "prediction": 1 }
    ]
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "composite_risk_score": 0.75,
    "overall_priority": "HIGH",
    "detected_clusters": [
      {
        "name": "Cardio-Metabolic Risk Cluster",
        "severity": "CRITICAL",
        "description": "Concurrent glycemic instability and cardiovascular strain detected."
      }
    ],
    "recommended_specialists": ["Cardiologist", "Endocrinologist"]
  }
  ```

#### Generate Clinician-Ready PDF
- **Method / URL**: `POST /api/reports/generate/`
- **Request Body**: Contains disease type, patient inputs, predictions, and uncertainty badges.
- **Response** (`201 Created`):
  ```json
  {
    "status": "success",
    "report_id": "453f35e9-c3de-48e8-b78f-a9b0c95a201b",
    "download_url": "/api/reports/453f35e9-c3de-48e8-b78f-a9b0c95a201b/download-pdf/"
  }
  ```

#### Model Evaluation Real Metrics
- **Method / URL**: `GET /api/model-evaluation/`
- **Response** (`200 OK`): Returns verified benchmark metrics, ROC AUC values, and confusion matrix data for all 4 diseases.

---

## Model Evaluation

All 4 disease modules were trained across 7 candidate algorithms using Stratified 5-Fold Cross-Validation. The test metrics reported below were measured on strictly held-out test splits (20% test fraction) and verified via `ml/reports/metrics.json`:

| Disease Module | Champion Algorithm | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Heart Disease** | **XGBoost Classifier** | **90.16%** | 84.38% | 96.43% | 0.9000 | **0.9416** |
| **Diabetes** | **Random Forest** | **75.32%** | 62.90% | 72.22% | 0.6724 | **0.8142** |
| **Parkinson’s Disease** | **K-Nearest Neighbors (KNN)** | **92.31%** | 100.0% | 89.66% | 0.9455 | **0.9966** |
| **Liver Disease** | **Logistic Regression** | **72.81%** | 93.10% | 66.67% | 0.7770 | **0.8114** |

### Complete Multi-Model Benchmark Comparison Table

```
========================================================================================
Disease       Algorithm           Accuracy   Precision   Recall     F1-Score   ROC-AUC
========================================================================================
Heart         XGBoost (Best)       90.16%     84.38%      96.43%     0.9000     0.9416
Heart         Random Forest        90.16%     86.67%      92.86%     0.8966     0.9416
Heart         Logistic Regression  86.89%     81.25%      92.86%     0.8667     0.9437
Heart         Naive Bayes          86.89%     79.41%      96.43%     0.8710     0.9491
Heart         KNN                  88.52%     80.00%     100.00%     0.8889     0.9177
Heart         SVM                  83.61%     80.00%      85.71%     0.8276     0.9426
Heart         Decision Tree        80.33%     76.67%      82.14%     0.7931     0.8339
----------------------------------------------------------------------------------------
Diabetes      Random Forest (Best) 75.32%     62.90%      72.22%     0.6724     0.8142
Diabetes      XGBoost              74.03%     61.67%      68.52%     0.6491     0.8131
Diabetes      Logistic Regression  71.43%     58.33%      64.81%     0.6140     0.8081
Diabetes      SVM                  70.78%     57.38%      64.81%     0.6087     0.7993
Diabetes      KNN                  70.78%     56.16%      75.93%     0.6457     0.7831
Diabetes      Naive Bayes          69.48%     55.38%      66.67%     0.6050     0.7741
Diabetes      Decision Tree        68.18%     52.87%      85.19%     0.6525     0.7721
----------------------------------------------------------------------------------------
Parkinson's   KNN (Best)           92.31%    100.00%      89.66%     0.9455     0.9966
Parkinson's   XGBoost              92.31%     96.43%      93.10%     0.9474     0.9828
Parkinson's   Random Forest        89.74%     96.30%      89.66%     0.9286     0.9638
Parkinson's   SVM                  87.18%     92.86%      89.66%     0.9123     0.9621
Parkinson's   Logistic Regression  84.62%     96.00%      82.76%     0.8889     0.9241
Parkinson's   Decision Tree        71.79%     84.62%      75.86%     0.8000     0.7207
Parkinson's   Naive Bayes          64.10%     94.12%      55.17%     0.6957     0.8586
----------------------------------------------------------------------------------------
Liver         Logistic Reg (Best)  72.81%     93.10%      66.67%     0.7770     0.8114
Liver         Decision Tree        74.56%     84.21%      79.01%     0.8153     0.7688
Liver         SVM                  73.68%     85.92%      75.31%     0.8026     0.7632
Liver         XGBoost              71.93%     76.34%      87.65%     0.8161     0.7411
Liver         Random Forest        69.30%     76.74%      81.48%     0.7904     0.7529
Liver         Naive Bayes          64.91%    100.00%      50.62%     0.6721     0.8096
Liver         KNN                  63.16%     80.00%      64.20%     0.7123     0.6783
========================================================================================
```

---

## Unique Intelligent Features

### 1. Uncertainty-Aware Prediction Shield
Clinical models should recognize when they do not know. Every prediction is subjected to uncertainty estimation based on:
- **Decision Margin Variance**: Proximity of the input vector to hyperplanes or tree ensemble dispersion.
- **Out-of-Distribution (OOD) Screening**: An Isolation Forest model trained alongside the primary classifier flags whether the patient's biomarker combination represents an unseen anomaly.
- **Trust Badges**:
  - `RELIABLE`: Standard operational range, high tree-agreement.
  - `UNCERTAIN`: Near boundary; advises complementary diagnostic tests.
  - `OUT-OF-DISTRIBUTION`: Suppressed output; alerts clinician that input pattern is outside reliable model training space.
  - `CRITICAL RED FLAG`: Emergency pattern overriding normal workflow.

### 2. Counterfactual What-If Risk Simulator
Provides exploratory prognostic feedback:
- **Modifiable Parameter Isolation**: Features like Age or Gender remain strictly locked, while variables like Fasting Glucose, Serum Cholesterol, or BMI can be varied via interactive sliders.
- **Impact Ranking**: Quantifies and ranks which specific lifestyle modification would yield the highest risk reduction percentage.

### 3. Multi-Disease Cross-Risk Engine
Diseases do not occur in physiological silos:
- Analyzes patient records across all 4 modules.
- Automatically flags syndromic patterns including:
  - **Metabolic Risk Cluster**: Elevated Glucose + BMI + Diastolic Pressure.
  - **Cardio-Metabolic Cluster**: Elevated Blood Pressure + High Cholesterol + High Glucose.
  - **Liver-Metabolic Cluster**: Elevated Liver Transaminases + Obesity + Glycemic Risk.
- Renders an interactive **Risk Radar Chart** providing cross-organ vulnerability assessments.

### 4. Clinician-Ready PDF Case Summary
Generates downloadable, print-ready reports containing:
- Unique cryptographically secure Report UUID and ISO timestamp.
- Detailed patient input parameter listing.
- Calibrated probability gauge, categorical risk level, and uncertainty status.
- Key contributing biomarker attributions and emergency red-flag triage findings.
- Educational medication and lifestyle recommendations.
- Prominent institutional and clinical disclaimers.

### 5. Data Quality & Trust Scoring
Prevents garbage-in, garbage-out errors before inference:
- Validates completeness and data types.
- Evaluates physiologically plausible clinical ranges.
- Computes a composite Data Quality Index (0–100%). Submissions below 60% are gated with actionable warnings to prevent misleading clinical inferences.

---

## Render Backend Deployment Guide

The Django REST Framework backend is container- and script-ready for seamless deployment to **Render**:

1. **Create Web Service**:
   - Link your GitHub repository (`SatishReddy2804/Multi-disease-prediction-using-Machine-Learning`).
   - Set the root directory to `multi_disease_prediction_system`.
   - Environment: `Python 3`.

2. **Configure Build & Start Commands**:
   - **Build Command**: `./build.sh` (or `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate`)
   - **Start Command**: `gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT`

3. **Set Environment Variables on Render**:
   ```ini
   SECRET_KEY=generate-a-secure-production-random-key
   DEBUG=False
   ALLOWED_HOSTS=your-service-name.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-frontend-name.netlify.app
   CSRF_TRUSTED_ORIGINS=https://your-frontend-name.netlify.app
   DATABASE_URL=postgresql://user:password@host/dbname
   MODEL_DIRECTORY=ml/models
   DATA_DIRECTORY=data
   REPORT_DIRECTORY=media/reports
   ```

4. **Add Managed PostgreSQL**:
   - Create a Render PostgreSQL database and paste the Internal Database URL into `DATABASE_URL`.

---

## Netlify Frontend Deployment Guide

The React 18 + Vite frontend can be deployed to **Netlify** with minimal configuration:

1. **Connect Repository**:
   - Authorize Netlify and select the repository.
   - Base Directory: `multi_disease_prediction_system/frontend`
   - Build Command: `npm run build`
   - Publish Directory: `dist`

2. **Set Environment Variables**:
   ```ini
   VITE_API_BASE_URL=https://your-backend-name.onrender.com
   VITE_APP_NAME=Multi-Disease Prediction System
   VITE_APP_ENVIRONMENT=production
   ```

3. **Configure SPA Redirects**:
   - The included `frontend/netlify.toml` automatically handles SPA routing:
     ```toml
     [[redirects]]
       from = "/*"
       to = "/index.html"
       status = 200
     ```

---

## Testing & Quality Assurance

The codebase includes an extensive automated test suite covering ML data preprocessing, inference pipelines, and API endpoints:

```bash
# Run the complete test suite with coverage
pytest ml/tests/ -v

# Run with test coverage report
pytest --cov=ml.src --cov=apps --cov-report=term-missing
```

### Verified Test Coverage:
- `test_data_ingestion`: Verifies CSV schema loading, header validation, and missing marker replacement.
- `test_data_cleaning`: Validates median/mode imputation, encoding, and target binarization.
- `test_feature_engineering`: Checks SMOTE balance on training sets and scaling isolation.
- `test_model_inference`: Ensures loaded model bundles return calibrated probabilities in the range `[0.0, 1.0]`.
- `test_uncertainty_engine`: Validates anomaly flags and Out-of-Distribution thresholding.
- `test_what_if_simulator`: Validates counterfactual stability when locking non-modifiable parameters.
- `test_cross_risk_engine`: Verifies multi-syndromic cluster identification.
- `test_data_quality`: Confirms boundary checks and low-quality data blocking.

---

## Performance

- **Inference Latency**: Average model inference latency is **< 15 ms** per patient using in-memory cached model singletons.
- **Data Quality & Triage Overhead**: Complete pre-inference validation and red-flag checking completes in **< 5 ms**.
- **PDF Report Generation**: Generation of styled ReportLab PDFs executes in **< 120 ms**.
- **Frontend Optimization**: Vite production bundle built in **< 9 seconds** with dynamic route-based chunk splitting and optimized asset delivery.

---

## Troubleshooting

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Model bundle not found** | Serialized `.joblib` file missing in `ml/models/`. | Run `python -m ml.src.train_models --disease all` to train and serialize all model artifacts. |
| **CORS policy rejection** | Origin mismatch between frontend and backend. | Verify `CORS_ALLOWED_ORIGINS` in `.env` includes your exact frontend port or Netlify URL. |
| **Data Quality 400 error** | Input values outside admissible clinical physiological ranges. | Verify entered values against medical norms or check tooltips in the form. |
| **Missing dependency error** | Incorrect Python virtual environment selected. | Activate the dedicated project environment (`venv\Scripts\activate` or `source venv/bin/activate`). |
| **Static files 404 in production** | Static collection step omitted. | Run `python manage.py collectstatic --no-input` or confirm WhiteNoise middleware is active. |

---

## Known Limitations

1. **Acoustic Diagnostic Context**: The Parkinson’s disease module relies solely on biomedical voice recordings. It functions as an exploratory vocal acoustic screener and cannot replace in-person neurological examinations or DaTscan neuroimaging.
2. **Dataset Demographics**: The Diabetes module is trained on the Pima Indians dataset; generalizing predictions to diverse global populations requires calibration on broader cohorts.
3. **Cross-Sectional Data**: The models evaluate static point-in-time biomarker snapshots rather than continuous longitudinal medical histories.
4. **Clinical Decision Support Only**: This platform is an assistive screening system and must never be used as an autonomous diagnostic authority.

---

## Medical Disclaimer

> **IMPORTANT CLINICAL NOTICE:**
>
> "This system is an educational decision-support tool. It does not provide a confirmed medical diagnosis. Always consult a qualified doctor for diagnosis, treatment, or medication decisions."
>
> "What-If results are simulated educational estimates. They do not guarantee that changing a clinical value will change an actual medical outcome."
>
> "Parkinson’s disease prediction in this system is based on biomedical voice measurements. It is not a confirmed diagnosis and should be followed by consultation with a neurologist or qualified medical professional."

---

## Future Scope

- **Expanded Pathology Modules**: Integration of Renal Disease (CKD), Stroke risk, and Pulmonary Pathology models.
- **Multimodal Diagnostic Imaging**: Inclusion of chest X-ray and retinal fundus imaging models via Convolutional Neural Networks (CNNs) and Vision Transformers (ViTs) with Grad-CAM visualization.
- **Electronic Health Record (EHR) Integration**: HL7 / FHIR standard API compatibility for direct interoperability with clinical hospital management systems.
- **Multilingual Support**: Localization of patient explanations and reports into multiple languages.

---

## Contributing

Contributions to improve data pipelines, refine model architectures, or expand clinical decision features are welcome:

1. Fork the repository: `https://github.com/SatishReddy2804/Multi-disease-prediction-using-Machine-Learning`
2. Create a feature branch: `git checkout -b feature/NewFeature`
3. Commit your changes: `git commit -m "Add NewFeature"`
4. Push to the branch: `git push origin feature/NewFeature`
5. Open a Pull Request.

---

## License

This project is licensed for educational and academic research purposes. Refer to the repository root for formal terms.
