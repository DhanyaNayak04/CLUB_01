// api.js

import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to include the auth token in every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response ${response.status}: ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // For debugging - log detailed information about API errors
      console.log(
        `API Error ${error.response.status}: ${error.config.method.toUpperCase()} ${error.config.url}`, 
        error.response.data
      );
      
      // If endpoint doesn't exist (404), log a more helpful message
      if (error.response.status === 404) {
        console.log(`Endpoint not found: ${error.config.url}. Check if the API route is implemented on your server.`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log('API Error: No response received', error.request);
    } else {
      // Something happened in setting up the request
      console.log('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export the api instance (both as default and named export)
export { api };
export default api;