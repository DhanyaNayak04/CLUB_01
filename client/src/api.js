import axios from 'axios';

// Make sure the API URL is correct and matches your server
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Make sure to log the actual baseURL being used
console.log('API base URL:', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout to prevent endless waiting
  timeout: 10000
});

// Add request interceptor to inject auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Log outgoing requests for debugging
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Improve response interceptor with better debugging
api.interceptors.response.use(
  (response) => {
    console.log(`API Response ${response.status}: ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`API Error ${error.response.status}: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, 
                   error.response.data);
    } else if (error.request) {
      console.error('API Error: No response received', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
