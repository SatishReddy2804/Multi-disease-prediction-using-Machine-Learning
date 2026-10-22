import { supabase, isSupabaseConfigured, SUPABASE_PROJECT_URL } from '../utils/supabase';

function normalizeSupabaseUser(user, fallbackData = {}) {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email,
    name: metadata.full_name || metadata.name || fallbackData.fullName || user.email?.split('@')[0] || 'Clinician',
    role: metadata.role || fallbackData.role || 'Attending Physician',
    department: metadata.department || fallbackData.department || 'Clinical Decision Support',
    createdAt: user.created_at,
    lastSignIn: user.last_sign_in_at,
  };
}

export const authService = {
  isConfigured() {
    return isSupabaseConfigured;
  },

  getProjectUrl() {
    return SUPABASE_PROJECT_URL;
  },

  async login(email, password) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase Auth is not configured. Please add your publishable/anon key as VITE_SUPABASE_ANON_KEY in frontend/.env to sign in.'
      );
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanEmail || !cleanPassword) {
      throw new Error('Please enter both email and password.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please verify your credentials.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Email address is not yet confirmed. Please verify your inbox or disable email confirmation in Supabase Dashboard.');
      }
      throw new Error(error.message || 'Authentication failed. Please verify credentials.');
    }

    const user = normalizeSupabaseUser(data.user);
    if (data.session?.access_token) {
      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('refresh_token', data.session.refresh_token || '');
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    return { success: true, user, session: data.session };
  },

  async register(formData) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase Auth is not configured. Please add your publishable/anon key as VITE_SUPABASE_ANON_KEY in frontend/.env to register.'
      );
    }

    const cleanEmail = String(formData.email || '').trim().toLowerCase();
    const cleanPassword = String(formData.password || '');
    const fullName = String(formData.fullName || formData.name || '').trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('Email and password are required.');
    }

    if (cleanPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          full_name: fullName,
          name: fullName,
          role: formData.role || 'Attending Physician',
          department: formData.department || 'Internal Medicine',
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered') || error.message.includes('already exists')) {
        throw new Error('A user with this email address already exists. Please sign in instead.');
      }
      throw new Error(error.message || 'Registration failed.');
    }

    const user = normalizeSupabaseUser(data.user, formData);
    if (data.session?.access_token) {
      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('refresh_token', data.session.refresh_token || '');
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    return {
      success: true,
      user,
      session: data.session,
      confirmationPending: !data.session,
    };
  },

  async logout() {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    return { success: true };
  },

  getCurrentUser() {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('access_token');
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('access_token') && localStorage.getItem('user'));
  },

  async getSession() {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session || null;
    } catch {
      return null;
    }
  },

  async getMe() {
    if (!isSupabaseConfigured || !supabase) {
      return this.getCurrentUser();
    }
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        const user = normalizeSupabaseUser(data.user);
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
    } catch (err) {
      console.warn('Failed to fetch user from Supabase:', err);
    }
    return this.getCurrentUser();
  },
};

export default authService;
