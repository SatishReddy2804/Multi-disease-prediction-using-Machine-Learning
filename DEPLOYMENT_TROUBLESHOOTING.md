# Deployment Troubleshooting Guide

This guide covers common errors encountered when deploying the Django ML backend to Render (Docker) and the React frontend to Netlify, along with direct diagnosis and resolution steps.

---

## 1. CORS Errors (Browser Console: `Cross-Origin Request Blocked`)

### Symptoms:
- Console shows: `Access to XMLHttpRequest at 'https://...onrender.com/api/predict/heart/' from origin 'https://...netlify.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- Network tab shows status `(failed)` or red for `OPTIONS` preflight request.

### Root Causes & Fixes:
1. **Trailing slash or missing protocol**:
   - `CORS_ALLOWED_ORIGINS` must be formatted as `https://your-site.netlify.app` with **no** trailing slash.
   - Do not write `your-site.netlify.app` (missing `https://`).
2. **Missing Render environment variable update**:
   - Ensure `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL` on Render contain your exact Netlify domain.
   - Click **Save Changes** on Render to trigger a redeployment.
3. **HTTP 500 error on preflight/endpoint**:
   - If Django throws an unhandled exception before CORS headers can be attached, the browser may report it as a CORS error. Inspect the Render log stream to check for internal Python exceptions.

---

## 2. Netlify 404 on Page Refresh (Deep Links / SPA Routing)

### Symptoms:
- Navigating via UI works fine, but refreshing on `https://your-site.netlify.app/predict/parkinsons` results in `Page Not Found (404)`.

### Root Cause & Fix:
- React Router manages client-side routes. Netlify tries to find an actual static HTML file at `/predict/parkinsons/index.html`.
- **Fix**: The repository includes `frontend/netlify.toml` and root `netlify.toml` with:
  ```toml
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
  Ensure this rule is in place so Netlify rewrites all non-asset requests to `index.html`.

---

## 3. Render Web Service Crashing on Startup / Port Binding Failure

### Symptoms:
- Render deploy logs show: `==> Port scan timeout reached, no open ports found on 0.0.0.0:8000` or container exits with code 1.

### Root Cause & Fix:
- Render dynamically assigns an arbitrary port via the `$PORT` environment variable (e.g. 10000). If Gunicorn hardcodes `--bind 0.0.0.0:8000`, Render cannot detect the open service.
- **Fix**: The `Dockerfile` entrypoint is configured as:
  ```dockerfile
  CMD ["sh", "-c", "gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --threads 2 --timeout 120"]
  ```
  Using `sh -c` ensures `${PORT:-8000}` expands at container runtime.

---

## 4. Render Health Check Fails (`503 Service Unavailable` or Degraded)

### Symptoms:
- Health check returns `status: degraded`.
- Endpoint returns HTTP 503 on `/health/`.

### Root Causes & Fixes:
1. **Supabase Database connection failed**:
   - Check the `database` field in the health response (`"error: ..."`).
   - Verify `DATABASE_URL` has the correct password and host for your Supabase PostgreSQL instance.
2. **Missing ML Model Artifacts**:
   - Check the `models` dictionary in the health check output.
   - Ensure the `.dockerignore` file does **not** ignore `ml/models/*.joblib`. All 20 model bundle files must be present in the Docker image.

---

## 5. Render Free Tier Cold Boot Delays

### Symptoms:
- First request after 15 minutes of inactivity takes 40–60 seconds, or displays a gateway timeout error.

### Explanation & Mitigation:
- Render's free tier spins down idle containers after 15 minutes.
- The startup process involves starting Python, loading the Django runtime, unpickling scikit-learn/XGBoost models (~15MB), and warming the database connection.
- **Fix**:
  - Gunicorn timeout is configured to `--timeout 120` to avoid premature worker kills during cold starts.
  - The frontend Axios client includes retry logic and extended timeout thresholds (15s).

---

## 6. Frontend Sending Requests to `localhost:8000` in Production

### Symptoms:
- In production, Network requests fail with `ERR_CONNECTION_REFUSED` targeting `http://localhost:8000/api/...`.

### Root Cause & Fix:
- Netlify build did not have `VITE_API_BASE_URL` set, so Vite defaulted to the fallback `http://localhost:8000`.
- **Fix**:
  1. Add `VITE_API_BASE_URL = https://your-backend.onrender.com` in Netlify **Site configuration → Environment variables**.
  2. Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy site**. (Vite variables are baked into static assets only at build time).
