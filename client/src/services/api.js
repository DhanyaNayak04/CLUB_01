import axios from 'axios';

// Create axios instance with base URL - ensure it points to the correct server
const api = axios.create({
  // Set a default baseURL that matches your server's address
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling function
const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error.response) {
    return Promise.reject(error.response.data);
  } else if (error.request) {
    return Promise.reject({ message: 'Server did not respond' });
  } else {
    return Promise.reject({ message: error.message });
  }
};

// Attendance related API calls
export const getEventAttendees = async (eventId) => {
  try {
    // Use correct API prefix
    const response = await api.get(`/api/attendance/event/${eventId}/attendees`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const submitAttendance = async (eventId, attendanceData) => {
  try {
    // attendanceData should be an array of { userId, present }
    const response = await api.post(`/api/attendance/event/${eventId}/submit`, { attendees: attendanceData });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const generateCertificates = async (eventId) => {
  // Optionally, you can keep this if you have a separate endpoint, but for now, attendance submission will handle certificate generation.
  try {
    const response = await api.post(`/api/attendance/event/${eventId}/submit`, { attendees: [] });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const saveAttendanceProgress = async (eventId, attendanceData) => {
  try {
    const response = await api.post(`/api/attendance/event/${eventId}/save`, { attendees: attendanceData });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getSavedAttendance = async (eventId) => {
  try {
    const response = await api.get(`/api/attendance/event/${eventId}/saved`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Export the API instance and error handler so they can be imported elsewhere
export { api, handleApiError };