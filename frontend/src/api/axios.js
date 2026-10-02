import axios from 'axios';
import { handleMockRequest } from './mockAdapter';

// Determine if we are hosted on an external domain (e.g. Vercel) without a remote backend URL
const isExternalHost = typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: isExternalHost ? 2500 : 7000,
});

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('pmec_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // If on Vercel without remote API configured, bypass Mixed Content blocks with the client mock
  if (isExternalHost && (!process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL.includes('localhost'))) {
    config.adapter = async (cfg) => {
      const mockRes = await handleMockRequest(cfg);
      return {
        data: mockRes.data,
        status: mockRes.status,
        statusText: 'OK',
        headers: {},
        config: cfg,
        request: {},
      };
    };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If backend is unreachable, network error, or mixed content block:
    const isNetworkIssue =
      !error.response ||
      error.message === 'Network Error' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK';

    if (isNetworkIssue && error.config) {
      console.warn('[PMEC Portal] Network unreachable. Utilizing client-side store for:', error.config.url);
      try {
        const mockRes = await handleMockRequest(error.config);
        return {
          data: mockRes.data,
          status: mockRes.status,
          statusText: 'OK',
          headers: {},
          config: error.config,
        };
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }
    return Promise.reject(error);
  }
);

// The static file server (uploads) lives on the same host as the API, minus the /api suffix.
export const FILE_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default api;
