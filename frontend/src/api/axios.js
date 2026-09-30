import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pmec_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// The static file server (uploads) lives on the same host as the API, minus the /api suffix.
export const FILE_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default api;
