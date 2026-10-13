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
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      if (access_token) localStorage.setItem('access_token', access_token);
      if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
      const userData = user || { email, name: email.split('@')[0], role: 'Clinician' };
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      // If backend auth is offline/mock mode for local dev:
      if (!err.status || err.message.includes('unavailable')) {
        const mockUser = {
          ...DEFAULT_DEMO_USER,
          email,
          name: email.includes('@') ? email.split('@')[0].toUpperCase() : 'Medical Officer',
        };
        const mockToken = 'mock_jwt_token_' + Date.now();
        localStorage.setItem('access_token', mockToken);
        localStorage.setItem('refresh_token', mockToken + '_refresh');
        localStorage.setItem('user', JSON.stringify(mockUser));
        return { success: true, user: mockUser, isDemo: true };
      }
      throw err;
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (err) {
      if (!err.status || err.message.includes('unavailable')) {
        const mockUser = {
          id: 'usr_' + Date.now(),
          email: userData.email,
          name: userData.fullName || userData.name || 'Dr. ' + userData.email.split('@')[0],
          role: userData.role || 'Resident Physician',
          department: userData.department || 'General Medicine',
        };
        const mockToken = 'mock_jwt_token_' + Date.now();
        localStorage.setItem('access_token', mockToken);
        localStorage.setItem('refresh_token', mockToken + '_refresh');
        localStorage.setItem('user', JSON.stringify(mockUser));
        return { success: true, user: mockUser, isDemo: true };
      }
      throw err;
    }
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
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  async getMe() {
    try {
      const response = await api.get('/auth/me');
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
