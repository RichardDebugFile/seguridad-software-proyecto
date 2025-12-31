import axios from 'axios';

const API_URL = 'http://localhost:3000';
const TOURNAMENT_API = 'http://localhost:3001';
const PLAYER_API = 'http://localhost:3002';

// Create axios instance with auth headers and token refresh
const createAuthApi = (baseURL) => {
  const api = axios.create({ baseURL });

  // Request interceptor: Agregar token a cada request
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: Manejar errores 401 y prevenir refresh durante logout
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // ⚠️ IMPORTANTE: No refrescar token si hay un logout en progreso
      if (localStorage.getItem('logout_in_progress')) {
        console.log('🚫 [Admin] Logout en progreso, no se refrescará el token');
        return Promise.reject(error);
      }

      // Redirigir a login en caso de 401 (no autorizado)
      if (error.response?.status === 401 && !originalRequest._retry) {
        console.log('⚠️ [Admin] Token inválido o expirado, redirigiendo a login');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = 'http://localhost:5173/login';
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );

  return api;
};

const authApi = createAuthApi(API_URL);
const tournamentApi = createAuthApi(TOURNAMENT_API);
const playerApi = createAuthApi(PLAYER_API);

// Auth Service
export const authService = {
  getCurrentUser: () => authApi.get('/auth/me'),
  logout: () => authApi.post('/auth/logout', {
    refreshToken: localStorage.getItem('refreshToken')
  }),
};

// Tournament Service
export const tournamentService = {
  getAll: () => tournamentApi.get('/tournaments'),
  getById: (id) => tournamentApi.get(`/tournaments/${id}`),
  create: (data) => tournamentApi.post('/tournaments', data),
  update: (id, data) => tournamentApi.put(`/tournaments/${id}`, data),
  delete: (id) => tournamentApi.delete(`/tournaments/${id}`),
};

// Player Service
export const playerService = {
  getAll: () => playerApi.get('/players'),
  getById: (id) => playerApi.get(`/players/${id}`),
  create: (data) => playerApi.post('/players', data),
  update: (id, data) => playerApi.put(`/players/${id}`, data),
  delete: (id) => playerApi.delete(`/players/${id}`),
};

export default authApi;
