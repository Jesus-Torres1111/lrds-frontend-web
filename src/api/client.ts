import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api', 
  timeout: 60000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  const sedeId = useAuthStore.getState().sedeSeleccionadaId;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (sedeId) {
    config.headers['X-Sede-ID'] = sedeId.toString();
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      console.error("Token inválido o expirado. Expulsando por seguridad.");
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } 
    else if (error.response?.status === 403) {
      console.warn("Acceso denegado (403). No tienes permiso para esta ruta específica, pero sigues logueado.");
    }
    else if (error.code === 'ECONNABORTED') {
      console.error("El servidor está tardando demasiado en cargar estos datos (Timeout).");
    }

    return Promise.reject(error);
  }
);

export default api;