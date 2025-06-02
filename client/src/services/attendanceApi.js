import { api, handleApiError } from '../utils/api';

// Get attendees for an event
export const getEventAttendees = async (eventId) => {
  try {
    const response = await api.get(`/attendance/event/${eventId}/attendees`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Submit attendance for an event
export const submitAttendance = async (eventId, attendees) => {
  try {
    console.log(`Submitting attendance to: /attendance/event/${eventId}/submit`);
    const response = await api.post(`/attendance/event/${eventId}/submit`, { attendees });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Close registration for an event
export const closeRegistration = async (eventId) => {
  try {
    const response = await api.post(`/attendance/event/${eventId}/close-registration`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Save attendance progress
export const saveAttendanceProgress = async (eventId, attendanceData) => {
  try {
    const response = await api.post(`/attendance/event/${eventId}/save`, { attendees: attendanceData });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get saved attendance
export const getSavedAttendance = async (eventId) => {
  try {
    const response = await api.get(`/attendance/event/${eventId}/saved`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
