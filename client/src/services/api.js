import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('zenith_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected route, clean up
      if (window.location.pathname.startsWith('/private-chat') || window.location.pathname.startsWith('/chat/')) {
        localStorage.removeItem('zenith_auth_token');
        localStorage.removeItem('zenith_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
