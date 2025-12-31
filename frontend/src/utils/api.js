import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ⚠️ IMPORTANTE: No refrescar token si hay un logout en progreso
    if (localStorage.getItem('logout_in_progress')) {
      console.log('🚫 Logout en progreso, no se refrescará el token');
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        // Si no hay refresh token, redirigir directamente
        if (!refreshToken) {
          console.log('⚠️ No hay refresh token, redirigiendo a login');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        console.log('🔄 Token expirado, intentando refrescar...');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        console.log('✅ Token refrescado exitosamente');
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Error al refrescar token:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  register: (email, password, username) =>
    api.post('/auth/register', { email, password, username }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return api.post('/auth/logout', { refreshToken });
  },

  getCurrentUser: () => api.get('/auth/me'),

  googleLogin: () => {
    window.location.href = `${API_URL}/auth/google`;
  },

  keycloakLogin: () => {
    window.location.href = `${API_URL}/auth/keycloak`;
  },

  keycloakSwitchUser: () => {
    window.location.href = `${API_URL}/auth/keycloak/switch-user`;
  },
};

export default api;
