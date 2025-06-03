// Centralized API configuration for the Club Management System
import axios from 'axios';

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api',
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

// ================================
// API Helper Functions
// ================================

// Auth API functions
export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// User API functions
export const users = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  getCoordinatorRequests: () => api.get('/users/coordinator-requests'),
  approveCoordinator: (userId) => api.post(`/users/approve-coordinator/${userId}`),
  rejectCoordinator: (userId) => api.post(`/users/reject-coordinator/${userId}`),
  uploadProfilePic: (formData) => api.post('/users/upload-profile-pic', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyEvents: () => api.get('/users/my-events'),
  getMyCertificates: () => api.get('/users/certificates')
};

// Club API functions
export const clubs = {  getAll: () => api.get('/clubs'),  getById: (id) => api.get(`/clubs/${id}`),
  create: (clubData) => api.post('/clubs', clubData),
  update: (id, clubData) => api.put(`/clubs/${id}`, clubData),
  delete: (id) => api.delete(`/clubs/${id}`),  updateDescription: (description) => {
    console.log('Updating club description:', { description });
    return api.put('/clubs/update-description', { description });
  }
};

// Event API functions
export const events = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  getByClub: (clubId) => api.get(`/events/club/${clubId}`),
  getRecent: () => api.get('/events/recent'),
  getMy: () => api.get('/events/my'), // Get events created by the logged-in coordinator
  create: (eventData) => api.post('/events', eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`),
  register: (eventId) => api.post(`/events/${eventId}/register`),
  getRegistrations: (eventId) => api.get(`/events/${eventId}/registrations`),
  getAttendees: (eventId) => api.get(`/events/${eventId}/attendees`),
  markAttendance: (eventId, attendanceData) => api.post(`/events/${eventId}/attendance`, attendanceData),
  requestVenue: (venueData) => api.post('/events/request-venue', venueData),
  getVenueRequests: () => api.get('/events/venue-requests'),
  getNotifications: () => api.get('/events/notifications')
};

// Attendance API functions
export const attendance = {
  getEventAttendees: (eventId) => api.get(`/attendance/event/${eventId}/attendees`),
  submitAttendance: (eventId, attendees) => api.post(`/attendance/event/${eventId}/submit`, { attendees }),
  closeRegistration: (eventId) => api.post(`/attendance/event/${eventId}/close-registration`),
  saveProgress: (eventId, attendees) => api.post(`/attendance/event/${eventId}/save`, { attendees })
};

// Certificate API functions
export const certificates = {
  getAll: () => api.get('/certificates'),
  getById: (id) => api.get(`/certificates/${id}`),
  generate: (eventId, participants) => api.post('/certificates/generate', { eventId, participants }),
  download: (certificateId) => api.get(`/certificates/${certificateId}/download`, { responseType: 'blob' })
};

// Admin API functions
export const admin = {
  getVenueRequests: () => api.get('/admin/venue-requests'),
  approveVenue: (requestId) => api.post(`/admin/approve-venue/${requestId}`),
  rejectVenue: (requestId) => api.post(`/admin/reject-venue/${requestId}`),
  cleanupVenueRequests: () => api.post('/admin/cleanup-venue-requests')
};

// Error handling helper
export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.message || 'Bad request';
      case 401:
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return 'Authentication required';
      case 403:
        return 'Access denied';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Server error occurred';
      default:
        return data.message || 'An error occurred';
    }
  } else if (error.request) {
    return 'Unable to connect to server';
  } else {
    return error.message || 'An unexpected error occurred';
  }
};