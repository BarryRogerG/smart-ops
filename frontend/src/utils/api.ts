import axios from 'axios';

// Get base URL and ensure it ends with /api (no trailing slash)
let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Log the raw VITE_API_URL for debugging
console.log('[API Config] VITE_API_URL from env:', import.meta.env.VITE_API_URL || 'NOT SET - using default');
console.log('[API Config] Raw baseUrl before processing:', baseUrl);

// Normalize the base URL:
// 1. Remove trailing slashes
baseUrl = baseUrl.replace(/\/+$/, '');
// 2. If it doesn't end with /api, append it
if (!baseUrl.endsWith('/api')) {
  baseUrl = `${baseUrl}/api`;
}
// 3. Ensure no trailing slash on final URL
baseUrl = baseUrl.replace(/\/+$/, '');

const API_BASE_URL = baseUrl;
console.log('[API Config] Final API_BASE_URL:', API_BASE_URL);
console.log('[API Config] Environment mode:', import.meta.env.MODE);

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
  
  // Normalize URL to prevent double slashes
  // Axios handles this, but let's be explicit
  const base = config.baseURL?.replace(/\/+$/, '') || '';
  const path = config.url?.replace(/^\/+/, '/') || '';
  const fullURL = `${base}${path}`;
  
  // Log request details for debugging
  console.log('🔵 API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    fullURL: fullURL,
    normalized: { base, path, fullURL },
  });
  
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log 404 errors with full details
    if (error.response?.status === 404) {
      const base = error.config?.baseURL?.replace(/\/+$/, '') || '';
      const path = error.config?.url?.replace(/^\/+/, '/') || '';
      const fullURL = `${base}${path}`;
      
      console.error('❌ 404 Error - Endpoint not found:', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: fullURL,
        normalized: { base, path, fullURL },
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        expectedBackendPath: '/api/auth/login',
        expectedFullURL: `${error.config?.baseURL}/auth/login`,
      });
    } else if (!error.response) {
      // Network error or CORS issue
      console.error('❌ Network Error (no response):', {
        message: error.message,
        code: error.code,
        config: error.config ? {
          method: error.config.method?.toUpperCase(),
          url: error.config.url,
          baseURL: error.config.baseURL,
          fullURL: `${error.config.baseURL}${error.config.url}`,
        } : 'No config',
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
