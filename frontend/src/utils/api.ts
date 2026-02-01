import axios from 'axios';

// Get base URL and ensure it ends with /api
let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Log the raw VITE_API_URL for debugging
if (import.meta.env.VITE_API_URL) {
  console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);
}

// If VITE_API_URL doesn't end with /api, append it
if (baseUrl && !baseUrl.endsWith('/api')) {
  baseUrl = baseUrl.endsWith('/') ? `${baseUrl}api` : `${baseUrl}/api`;
}

const API_BASE_URL = baseUrl;
console.log('API_BASE_URL configured as:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Log request details for debugging
  console.log('API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    data: config.data,
    headers: config.headers,
  });
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log 404 errors with full details
    if (error.response?.status === 404) {
      console.error('404 Error - Endpoint not found:', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
    }
    
    // Only redirect on 401 if we're NOT on the login page and it's NOT a login request
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isOnLoginPage = window.location.pathname === '/login';
      
      // Don't redirect if it's a login request or we're already on login page
      if (!isLoginRequest && !isOnLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
