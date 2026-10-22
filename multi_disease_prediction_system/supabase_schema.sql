-- ==============================================================================
-- Supabase Schema & Row-Level Security (RLS) Policies
-- Multi-Disease Prediction Clinical Decision Support System
-- Project: https://qwudleauzofzfdkeklvq.supabase.co
-- ==============================================================================

-- 1. Create profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'Attending Physician',
    department TEXT DEFAULT 'Internal Medicine',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Authenticated clinicians can only read & update their OWN profile
CREATE POLICY "Clinicians can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Clinicians can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Clinicians can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Deny all anonymous access explicitly
CREATE POLICY "Deny anonymous access"
    ON public.profiles
    FOR ALL
    TO anon
    USING (false);

-- 4. Automatic Profile Creation on Signup via Database Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, department)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'Attending Physician'),
        COALESCE(NEW.raw_user_meta_data->>'department', 'Internal Medicine')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger firing whenever a new user signs up in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Optional: Patient Prediction Records with RLS (if stored in Supabase)
CREATE TABLE IF NOT EXISTS public.clinical_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    disease_type TEXT NOT NULL,
    patient_mrn TEXT NOT NULL,
    input_data JSONB NOT NULL,
    prediction_result INTEGER NOT NULL,
    probability NUMERIC(6, 4) NOT NULL,
    risk_level TEXT NOT NULL,
    uncertainty_level TEXT NOT NULL,
    trust_status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.clinical_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians can access own patient predictions"
    ON public.clinical_predictions
    FOR ALL
    TO authenticated
    USING (auth.uid() = clinician_id)
    WITH CHECK (auth.uid() = clinician_id);

CREATE POLICY "Deny anonymous access to patient predictions"
    ON public.clinical_predictions
    FOR ALL
    TO anon
    USING (false);
