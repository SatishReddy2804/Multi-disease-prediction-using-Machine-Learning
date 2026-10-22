# Supabase Authentication Setup Guide

**Project URL:** `https://qwudleauzofzfdkeklvq.supabase.co`  
**Application:** Multi-Disease Clinical Decision Support Platform  

---

## 1. Quick Start (1-Minute Configuration)

Your project is already configured with your Supabase Project URL:
```env
VITE_SUPABASE_URL=https://qwudleauzofzfdkeklvq.supabase.co
```

To enable live user accounts (registration, login, session persistence, and protected routes), you only need to supply your **Publishable / Anon API Key**.

---

## 2. Step-by-Step Instructions

### Step 2.1: Obtain your Publishable Anon Key
1. Open your browser and navigate to the Supabase Dashboard:
   [https://supabase.com/dashboard/project/qwudleauzofzfdkeklvq](https://supabase.com/dashboard/project/qwudleauzofzfdkeklvq)
2. In the left navigation menu, click **Project Settings** (gear icon at the bottom).
3. Under the Configuration section, click **API**.
4. In the **Project API keys** panel, locate the key labeled:
   - `anon` `public`
5. Click **Copy** next to the `anon` key.
   > **CRITICAL SECURITY WARNING:** Never copy or use the `service_role` (secret) key in the frontend. The `anon` key is safe for browser use; the `service_role` key can bypass all database security and must never be committed or placed in client files.

### Step 2.2: Add Key to `frontend/.env`
Open `frontend/.env` in your editor and update the `VITE_SUPABASE_ANON_KEY` line:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Multi-Disease Prediction System
VITE_APP_ENVIRONMENT=development

# Supabase Auth Configuration
VITE_SUPABASE_URL=https://qwudleauzofzfdkeklvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...<paste-your-copied-anon-key-here>
```

*(Optional for Backend JWT Verification)*:
In root `.env`, if you wish Django to verify tokens with HMAC-SHA256:
```env
SUPABASE_URL=https://qwudleauzofzfdkeklvq.supabase.co
SUPABASE_JWT_SECRET=<paste-jwt-secret-from-api-settings>
```

### Step 2.3: Configure Redirect URLs in Supabase Dashboard
1. In Supabase Dashboard, click **Authentication** (left sidebar).
2. Click **URL Configuration**.
3. Under **Site URL**, set:
   ```text
   http://localhost:5173
   ```
4. Under **Redirect URLs**, add:
   ```text
   http://localhost:5173/**
   ```
5. Click **Save**.

### Step 2.4: Email Confirmation Settings
- **For instant testing without email delivery setup:**
  1. Go to **Authentication** &rarr; **Providers** &rarr; **Email**.
  2. Toggle **Confirm email** to **OFF** (disabled).
  3. Click **Save**.
  *(This allows newly registered clinicians to sign in immediately without waiting for an email confirmation link).*
- **If you keep email confirmation enabled:**
  When a clinician registers, they will see a notification advising them to click the confirmation link in their inbox before signing in.

### Step 2.5: Run the Database Profiles Schema
1. In Supabase Dashboard, click **SQL Editor** (left sidebar).
2. Click **New Query**.
3. Copy and paste the entire contents of `supabase_schema.sql` (located in the project root).
4. Click **Run**.
5. This sets up:
   - The `public.profiles` table linked to `auth.users`
   - Row-Level Security (RLS) policies allowing users to access only their own data
   - Automatic profile generation trigger upon new clinician signup.

---

## 3. How to Verify Authenticated Workflows

1. **Start the Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173`.

2. **Test Clinician Registration:**
   - Click **Register Clinical Account** (or visit `http://localhost:5173/register`).
   - Enter your name, email, department, and a password (min 6 characters).
   - Click **Create Clinical Account**.
   - Your account is created directly inside your Supabase project!

3. **Test Sign-In:**
   - Visit `http://localhost:5173/login`.
   - Enter your registered email and password.
   - Click **Sign In to Clinical Dashboard**.
   - You will be redirected into the authenticated clinical workspace.

4. **Test Session Persistence:**
   - Refresh the page (F5).
   - Notice the session is retained automatically without logging you out.

5. **Test Protected Route Guard:**
   - Click your profile / Sign Out button in the navigation.
   - Try navigating directly to `http://localhost:5173/history`.
   - You will be cleanly redirected back to `/login`.

---

## 4. Security Checklist

- [x] Publishable/anon key is the ONLY key used in Vite frontend code.
- [x] No `service_role` keys or database passwords committed to Git.
- [x] Row Level Security (RLS) enabled on all tables in Supabase.
- [x] Passwords managed exclusively by Supabase Auth (never stored in local custom tables or plain text).
- [x] JWT tokens securely passed via `Authorization: Bearer <token>` to Django backend.
