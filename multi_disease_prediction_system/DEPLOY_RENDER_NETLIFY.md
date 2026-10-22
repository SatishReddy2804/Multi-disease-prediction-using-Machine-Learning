# Step-by-Step Guide: Deploying Backend on Render (Docker) & Frontend on Netlify

This guide provides click-by-click instructions to deploy the **Django ML Backend** on **Render** using a custom **Docker** container and the **React + Vite Frontend** on **Netlify**, connected securely to Supabase.

---

## Architecture & Communication Flow

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│         Netlify Frontend        │           │       Render Docker Backend     │
│  https://<your-site>.netlify.app│ ────────► │ https://<your-api>.onrender.com │
│ (Vite static SPA with redirects)│  REST API │    (Gunicorn + WSGI on $PORT)   │
└────────────────┬────────────────┘           └────────────────┬────────────────┘
                 │                                             │
                 │         ┌─────────────────────────┐         │
                 └───────► │      Supabase Auth      │ ◄───────┘
                           │  qwudleauzofzfdkeklvq   │ (Validates JWT / DB)
                           └─────────────────────────┘
```

---

## Phase 1: Git Push to GitHub

Ensure all repository updates are pushed to your remote GitHub repository:

```bash
git status
git add .
git commit -m "Configure Dockerfile, .dockerignore, and Netlify deployment"
git push origin main
```

---

## Phase 2: Deploy Backend on Render (Docker Runtime)

### Step 2.1 — Create New Web Service
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your GitHub repository.

### Step 2.2 — Configure Service Settings
Fill in the following fields:
- **Name**: `multi-disease-prediction-api` (or your chosen name)
- **Region**: Choose the region closest to your users / Supabase (e.g., *Frankfurt*, *Singapore*, or *Oregon*).
- **Branch**: `main`
- **Root Directory**: Leave **blank** (uses repo root `multi_disease_prediction_system`).
- **Runtime**: Select **Docker** (Render will automatically detect the `Dockerfile` in the root).
- **Instance Type**: **Free** (or Starter for persistent RAM).

### Step 2.3 — Add Production Environment Variables
Scroll to **Environment Variables** and add the following keys:

| Key | Value / Example | Notes |
| :--- | :--- | :--- |
| `SECRET_KEY` | *(Generate a 50+ random character string)* | Essential for Django production security. |
| `DEBUG` | `False` | Never set `True` in production. |
| `ALLOWED_HOSTS` | `.onrender.com` | Hostname only, no `https://`. Auto-captures Render subdomain. |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.qwudleauzofzfdkeklvq.supabase.co:5432/postgres` | Your Supabase PostgreSQL URI (see Supabase Dashboard → Settings → Database). |
| `SUPABASE_URL` | `https://qwudleauzofzfdkeklvq.supabase.co` | Your Supabase project URL. |
| `SUPABASE_JWT_SECRET` | *(From Supabase Settings → API → JWT Secret)* | Used by DRF to verify user JWT tokens. |
| `MODEL_DIRECTORY` | `ml/models` | Resolves models bundled inside the Docker image. |
| `DATA_DIRECTORY` | `data` | Resolves dataset fixtures. |
| `REPORT_DIRECTORY` | `media/reports` | Directory for generated PDF reports. |
| `CORS_ALLOWED_ORIGINS` | Leave empty for first deploy *(will set in Phase 4)* | |
| `CSRF_TRUSTED_ORIGINS` | Leave empty for first deploy *(will set in Phase 4)* | |
| `FRONTEND_URL` | Leave empty for first deploy *(will set in Phase 4)* | |

### Step 2.4 — Configure Health Check Path
1. Under **Advanced Settings**, find **Health Check Path**.
2. Enter:
   ```text
   /health/
   ```
3. Click **Create Web Service**.

### Step 2.5 — Verify Backend Health
Once Render completes building and running the container:
1. Render gives you an HTTPS URL: `https://multi-disease-prediction-api.onrender.com`.
2. Visit `https://multi-disease-prediction-api.onrender.com/health/` in your browser.
3. Expected JSON response:
   ```json
   {
     "status": "healthy",
     "service": "multi-disease-prediction-system",
     "database": "connected",
     "models": {
       "heart": {"status": "available", "model": "XGBoost", "features_count": 13},
       "diabetes": {"status": "available", "model": "RandomForest", "features_count": 8},
       "parkinsons": {"status": "available", "model": "KNN", "features_count": 22},
       "liver": {"status": "available", "model": "LogisticRegression", "features_count": 10}
     }
   }
   ```

---

## Phase 3: Deploy Frontend on Netlify

### Step 3.1 — Create New Site
1. Log in to [app.netlify.com](https://app.netlify.com).
2. Click **Add new site** → **Import an existing project**.
3. Authorize GitHub and select your repository.

### Step 3.2 — Build Settings
Netlify will automatically detect `netlify.toml`, but confirm the settings:
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist` (or `dist` if base is `frontend`)

### Step 3.3 — Set Environment Variables
Go to **Site configuration** → **Environment variables** (or during setup) and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://multi-disease-prediction-api.onrender.com` | **Your actual Render HTTPS URL. NO trailing slash and NO `/api` suffix.** |
| `VITE_SUPABASE_URL` | `https://qwudleauzofzfdkeklvq.supabase.co` | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | *(Your public publishable anon key from Supabase Dashboard)* | Safe for public frontend. |
| `VITE_APP_NAME` | `Multi-Disease Prediction System` | Title. |
| `VITE_APP_ENVIRONMENT` | `production` | Mode. |

### Step 3.4 — Deploy
1. Click **Deploy [Site Name]**.
2. Once the build finishes, Netlify provides your site URL:
   `https://<your-site-name>.netlify.app`

---

## Phase 4: Connect Render and Netlify (CORS & Auth Linking)

Now that you have both URLs:
- **Frontend (Netlify)**: `https://<your-site-name>.netlify.app`
- **Backend (Render)**: `https://multi-disease-prediction-api.onrender.com`

### Step 4.1 — Update Render Environment Variables
1. Go to [Render Dashboard](https://dashboard.render.com) → click your Web Service → **Environment**.
2. Update the following variables:
   - `CORS_ALLOWED_ORIGINS`:
     ```text
     https://<your-site-name>.netlify.app,http://localhost:5173
     ```
   - `CSRF_TRUSTED_ORIGINS`:
     ```text
     https://<your-site-name>.netlify.app
     ```
   - `FRONTEND_URL`:
     ```text
     https://<your-site-name>.netlify.app
     ```
3. Click **Save Changes**. Render will automatically redeploy the service.

### Step 4.2 — Update Supabase URL Configuration
1. Open the [Supabase Dashboard](https://supabase.com/dashboard/project/qwudleauzofzfdkeklvq).
2. Go to **Authentication** → **URL Configuration**.
3. Set **Site URL** to:
   ```text
   https://<your-site-name>.netlify.app
   ```
4. Add to **Redirect URLs**:
   ```text
   https://<your-site-name>.netlify.app/**
   http://localhost:5173/**
   ```
5. Click **Save**.

---

## Phase 5: Verification in Browser

1. Open `https://<your-site-name>.netlify.app` in your browser.
2. Open DevTools (`F12`) → **Network** tab.
3. Test **Heart Prediction**:
   - Fill inputs and submit.
   - Verify request goes to `https://multi-disease-prediction-api.onrender.com/api/predict/heart/`.
   - Response status: `200 OK` with JSON metrics and risk analysis.
4. Test **Diabetes**, **Parkinson's**, and **Liver** predictions to verify all 4 ML models execute without failure.
5. Log in or create an account with Supabase Auth to confirm authentication and protected dashboard routes function smoothly.
