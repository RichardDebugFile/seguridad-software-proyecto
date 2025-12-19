import axios from 'axios';

const API_URL = 'http://localhost:3000';
const TOURNAMENT_API = 'http://localhost:3001';
const PLAYER_API = 'http://localhost:3002';

// Create axios instance with auth headers
const createAuthApi = (baseURL) => {
  const api = axios.create({ baseURL });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

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
