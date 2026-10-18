import api from './api';

const DEFAULT_DEMO_USER = {
  id: 'usr_demo_101',
  email: 'clinician@hospital.org',
  name: 'Dr. Sarah Connor, MD',
  role: 'Attending Physician',
  department: 'Cardiology & Internal Medicine',
};

export const authService = {
  async login(email, password) {
    const response = await api.post('/api/auth/login/', {
      username: email,
      email,
      password,
    });
    const data = response.data;
    const access_token = data.access || data.access_token || data.tokens?.access;
    const refresh_token = data.refresh || data.refresh_token || data.tokens?.refresh;
    if (access_token) localStorage.setItem('access_token', access_token);
    if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
    const userData = data.user || { email, name: email.split('@')[0], role: 'Clinician' };
    localStorage.setItem('user', JSON.stringify(userData));
    return { success: true, user: userData };
  },

  async register(userData) {
    const response = await api.post('/api/auth/register/', userData);
    const data = response.data;
    const access_token = data.access || data.access_token || data.tokens?.access;
    const refresh_token = data.refresh || data.refresh_token || data.tokens?.refresh;
    if (access_token) localStorage.setItem('access_token', access_token);
    if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('access_token');
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('access_token'));
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');
    const response = await api.post('/api/auth/token/refresh/', { refresh: refreshToken });
    const newToken = response.data.access || response.data.access_token || response.data.tokens?.access;
    if (newToken) {
      localStorage.setItem('access_token', newToken);
    }
    return response.data;
  },

  async getMe() {
    try {
      const response = await api.get('/api/auth/me/');
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
    } catch {
      // Fallback to local stored user
      return this.getCurrentUser();
    }
    return this.getCurrentUser();
  },
};

export default authService;
