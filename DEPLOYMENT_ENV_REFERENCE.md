# Deployment Environment Variables Reference

This document provides a comprehensive reference of all environment variables used by the Multi-Disease Prediction System for both local development and production deployments (Render & Netlify).

---

## 1. Backend Environment Variables (Render Web Service)

Set these in the **Environment** tab of your Render Web Service dashboard.

| Variable Name | Required | Example Format | Purpose & Local vs Production Behavior |
| :--- | :---: | :--- | :--- |
| `SECRET_KEY` | **Yes** | `d98f7e2a4b1c8e...` *(50+ random characters)* | Cryptographic signing key for Django sessions and CSRF tokens. Never use the default dev key in production. |
| `DEBUG` | **Yes** | `False` | Disables debug mode and Django tracebacks in production. Local defaults to `True`. |
| `ALLOWED_HOSTS` | **Yes** | `.onrender.com,localhost,127.0.0.1` | Hostnames that Django can serve. Do NOT include `https://` or path slashes. `.onrender.com` matches all Render subdomains. |
| `DATABASE_URL` | **Yes** | `postgresql://postgres:[PASSWORD]@db.qwudleauzofzfdkeklvq.supabase.co:5432/postgres` | Connects Django to your Supabase PostgreSQL instance. If left blank, falls back to ephemeral local SQLite `db.sqlite3`. |
| `CORS_ALLOWED_ORIGINS` | **Yes** | `https://your-site.netlify.app,http://localhost:5173` | Comma-separated list of browser origins permitted to make cross-origin API calls. Must include `https://` and have NO trailing slash. |
| `CSRF_TRUSTED_ORIGINS` | **Yes** | `https://your-site.netlify.app` | Comma-separated list of origins trusted for CSRF validation. Must include `https://` and have NO trailing slash. |
| `FRONTEND_URL` | **Yes** | `https://your-site.netlify.app` | Netlify frontend origin for redirects and CORS auto-inclusion. |
| `BACKEND_URL` | No | `https://multi-disease-prediction-api.onrender.com` | Public URL of the backend service. Defaults to `http://localhost:8000`. |
| `MODEL_DIRECTORY` | No | `ml/models` | Path to ML model joblib files inside the container. Automatically resolved against Django `BASE_DIR`. |
| `DATA_DIRECTORY` | No | `data` | Path to data directory. Resolved against `BASE_DIR`. |
| `REPORT_DIRECTORY` | No | `media/reports` | Path where generated PDF medical reports are saved. |
| `SUPABASE_URL` | **Yes** | `https://qwudleauzofzfdkeklvq.supabase.co` | Supabase API endpoint. |
| `SUPABASE_JWT_SECRET` | **Yes** | `your-supabase-jwt-secret` | Supabase JWT secret from Project Settings → API → JWT Settings for validating user tokens. |
| `DJANGO_LOG_LEVEL` | No | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |

---

## 2. Frontend Environment Variables (Netlify Site Configuration)

Set these in **Site configuration** → **Environment variables** on Netlify.

> [!NOTE]
> Vite embeds environment variables into the static JavaScript bundle **at build time**. Any changes to these variables require triggering a **new deploy / rebuild** on Netlify.

| Variable Name | Required | Example Format | Purpose & Behavior |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `https://multi-disease-prediction-api.onrender.com` | **Canonical backend origin.** <br>• Must include `https://`. <br>• Must **NOT** have a trailing slash (`/`). <br>• Must **NOT** include `/api` (all frontend endpoints prefix `/api/...` automatically). <br>• In local dev, defaults to `http://localhost:8000`. |
| `VITE_SUPABASE_URL` | **Yes** | `https://qwudleauzofzfdkeklvq.supabase.co` | Public Supabase project URL used by `@supabase/supabase-js`. |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | `eyJhbGciOiJIUzI1NiIsInR5c...` | Public publishable anon key from Supabase Dashboard. Safe to expose on client-side. |
| `VITE_APP_NAME` | No | `Multi-Disease Prediction System` | Application display name. |
| `VITE_APP_ENVIRONMENT` | No | `production` | Environment flag (`development`, `staging`, `production`). |

---

## 3. Secret Management & Security Rules

1. **Never commit `.env` files**: Both root `.env` and `frontend/.env` are in `.gitignore`.
2. **Never expose service-role keys**: Use only the **anon** publishable key on the frontend. Never use the Supabase `service_role` key in frontend code or environment variables.
3. **Vite Variable Exposure**: Any variable starting with `VITE_` is visible in the browser bundle. Never put database passwords, private keys, or Django secret keys in `VITE_` variables.
