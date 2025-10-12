import axios from 'axios';
import { API_URL } from './env';
import { useAuth } from '../features/auth/auth.store';

const baseURL = API_URL || 'https://localhost:7227/api/v1'; // por si acaso
console.log('[api] baseURL =', baseURL);

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      useAuth.getState().logout();
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(error);
  }
);
