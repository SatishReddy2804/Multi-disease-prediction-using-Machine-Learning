import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data?.session && mounted) {
            setSession(data.session);
            const normalized = authService.getCurrentUser() || {
              id: data.session.user.id,
              email: data.session.user.email,
              name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0],
              role: data.session.user.user_metadata?.role || 'Clinician',
            };
            setUser(normalized);
            localStorage.setItem('access_token', data.session.access_token);
            localStorage.setItem('user', JSON.stringify(normalized));
          } else if (mounted) {
            // Check fallback local session if any
            const cached = authService.getCurrentUser();
            if (cached && authService.isAuthenticated()) {
              setUser(cached);
            }
          }
        } catch (err) {
          console.warn('Supabase getSession failed:', err);
        } finally {
          if (mounted) setLoading(false);
        }

        // Subscribe to auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              setSession(currentSession);
              if (currentSession?.user) {
                const normalized = {
                  id: currentSession.user.id,
                  email: currentSession.user.email,
                  name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0],
                  role: currentSession.user.user_metadata?.role || 'Clinician',
                };
                setUser(normalized);
                localStorage.setItem('access_token', currentSession.access_token);
                localStorage.setItem('user', JSON.stringify(normalized));
              }
            } else if (event === 'SIGNED_OUT') {
              setSession(null);
              setUser(null);
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
            }
          }
        );

        return () => {
          mounted = false;
          authListener?.subscription?.unsubscribe();
        };
      } else {
        // Supabase not configured yet - check local cache
        const cached = authService.getCurrentUser();
        if (cached && authService.isAuthenticated()) {
          setUser(cached);
        }
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.user) {
      setUser(res.user);
      setSession(res.session || null);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res.user && res.session) {
      setUser(res.user);
      setSession(res.session);
    }
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    isAuthenticated: Boolean(user && (session || authService.isAuthenticated())),
    isConfigured: isSupabaseConfigured,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
