# Production Deployment Guide: Render Backend + Netlify Frontend

This guide describes end-to-end deployment for the **Multi-Disease Prediction System** across Render (Django REST Framework + PostgreSQL) and Netlify (React 18 + Vite SPA).

---

## 1. Render Backend & PostgreSQL Deployment

### Step 1: Create Render PostgreSQL Database
1. Navigate to the Render Dashboard (`dashboard.render.com`) and click **New +** -> **PostgreSQL**.
2. **Name:** `multi-disease-postgres`
3. **Database:** `multi_disease_db`
4. **User:** `db_admin`
5. Select Free or Starter Tier and click **Create Database**.
6. Copy the **Internal Database URL** (e.g., `postgresql://db_admin:password@dpg-xxxx/multi_disease_db`).

### Step 2: Create Render Web Service
1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository containing `multi_disease_prediction_system/`.
3. Configure the service settings:
   - **Environment:** `Python 3`
   - **Build Command:** `./build.sh`
   - **Start Command:** `python -m gunicorn backend.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
4. Set Environment Variables in Render:
   ```env
   SECRET_KEY=production-django-secret-key-32-chars-long
   DEBUG=False
   ALLOWED_HOSTS=.onrender.com,your-backend-domain.onrender.com
   CSRF_TRUSTED_ORIGINS=https://your-frontend-site.netlify.app
   CORS_ALLOWED_ORIGINS=https://your-frontend-site.netlify.app
   DATABASE_URL=postgresql://db_admin:password@dpg-xxxx/multi_disease_db
   MODEL_DIRECTORY=ml/models
   DATA_DIRECTORY=data
   REPORT_DIRECTORY=media/reports
   FRONTEND_URL=https://your-frontend-site.netlify.app
   BACKEND_URL=https://your-backend-domain.onrender.com
   ```
5. Click **Deploy Web Service**. Render executes `./build.sh` to install dependencies, collect static files with WhiteNoise, and apply database migrations.

---

## 2. Netlify Frontend Deployment

### Step 1: Connect GitHub Repository
1. Log in to Netlify (`app.netlify.com`) and click **Add new site** -> **Import an existing project**.
2. Select your repository.
3. Configure build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`

### Step 2: Configure Netlify Environment Variables
In **Site configuration** -> **Environment variables**, set:
```env
VITE_API_BASE_URL=https://your-backend-domain.onrender.com
VITE_APP_NAME=Multi-Disease Clinical Decision Support System
VITE_APP_ENVIRONMENT=production
```

### Step 3: Client-Side Routing Configuration
`frontend/netlify.toml` automatically handles SPA routing redirects:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
4. Click **Deploy Site**.

---

## 3. Local Development (Offline Laptop)

### Backend:
```bash
# Activate virtualenv (or use muvora environment)
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open browser to `http://localhost:5173`.
