# Production Deployment Guide: Render & Netlify

## Multi-Disease Prediction System

This guide provides step-by-step instructions to deploy the Django REST Framework backend on **Render** and the React/Vite frontend on **Netlify**.

---

## 1. Architecture Overview
- **Backend**: Python 3.11+, Django 4.2+, Django REST Framework, WhiteNoise, Gunicorn, PostgreSQL/SQLite.
- **Hosting (Backend)**: Render Web Service.
- **Frontend**: React 18, Vite, Tailwind CSS, Axios.
- **Hosting (Frontend)**: Netlify.
- **Domain Interconnect**: CORS and CSRF trusted origins dynamically linked via environment variables.

---

## 2. Deploying the Backend on Render

### Step 1: Create a Render Web Service
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `https://github.com/SatishReddy2804/Multi-disease-prediction-using-Machine-Learning`.
4. Configure service settings:
   - **Name**: `multi-disease-prediction-backend`
   - **Root Directory**: `multi_disease_prediction_system`
   - **Environment**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT`
   - **Instance Type**: Free or Starter (at least 512MB RAM recommended).

### Step 2: Configure Environment Variables on Render
Under the **Environment** tab of your Render service, add the following variables:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | Ensures compatible Python runtime |
| `DJANGO_SECRET_KEY` | *(Generate a secure random string)* | Production secret key |
| `DEBUG` | `False` | Disables debug mode in production |
| `RENDER_EXTERNAL_HOSTNAME` | `multi-disease-prediction-backend.onrender.com` | Auto-populated by Render |
| `FRONTEND_URL` | `https://your-app-name.netlify.app` | URL of your deployed Netlify frontend |
| `DATABASE_URL` | *(Optional)* | Connects managed PostgreSQL (falls back to SQLite if omitted) |

### Step 3: Trigger Initial Deploy
Click **Create Web Service**. Render will execute `build.sh`:
- Installs dependencies from `requirements.txt`.
- Collects static files using WhiteNoise into `staticfiles/`.
- Runs database migrations.
- Serves the application with Gunicorn.

Verify the health check once deployed:
`https://<your-render-url>/api/health/`

---

## 3. Deploying the Frontend on Netlify

### Step 1: Connect Netlify to GitHub
1. Log in to [app.netlify.com](https://app.netlify.com).
2. Click **Add new site** -> **Import an existing project**.
3. Select GitHub and choose your repository.

### Step 2: Configure Build Settings
Netlify will automatically detect configuration from `netlify.toml`:
- **Base directory**: `multi_disease_prediction_system/frontend`
- **Build command**: `npm run build`
- **Publish directory**: `multi_disease_prediction_system/frontend/dist`

### Step 3: Set Frontend Environment Variables
Under **Site configuration** -> **Environment variables**, set:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://<your-render-url>` *(No trailing slash)* | Points API calls to your Render backend |

### Step 4: Deploy Site
Click **Deploy site**. Netlify will build the Vite assets and deploy them with client-side SPA routing (`/* -> /index.html`).

---

## 4. Post-Deployment Verification Checklist
1. Visit `https://<your-app-name>.netlify.app`.
2. Register a new user or log in.
3. Test a disease prediction (e.g., Heart Disease). Confirm genuine ML predictions, SHAP risk drivers, and prevention advice load.
4. Test the What-If Simulator and Cross-Risk Engine.
5. Download a clinical PDF report.
