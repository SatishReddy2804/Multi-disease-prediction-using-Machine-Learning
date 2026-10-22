import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qwudleauzofzfdkeklvq.supabase.co';
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  rawAnonKey &&
  rawAnonKey !== 'your-supabase-publishable-anon-key-here' &&
  rawAnonKey.length > 20
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, rawAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const SUPABASE_PROJECT_URL = supabaseUrl;
