import axios from 'axios';
import { useAuthStore } from '../store/authStore';

let baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// When deployed on Render, NEXT_PUBLIC_API_URL is set to the backend's root URL (e.g., https://backend.onrender.com)
// We need to append '/api' to it so requests match the backend's route setup.
if (baseURL && !baseURL.endsWith('/api') && baseURL !== 'http://localhost:5000/api') {
  baseURL = `${baseURL.replace(/\/+$/, '')}/api`;
}

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
