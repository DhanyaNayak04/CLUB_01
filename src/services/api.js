import api from '../api';

// Error handling function
const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error.response) {
    return Promise.reject(error.response.data);
  } else if (error.request) {
    return Promise.reject({ message: 'No response received from server' });
  } else {
    return Promise.reject({ message: error.message });
  }
};

// Get attendees for an event
export const getEventAttendees = async (eventId) => {
  try {
    // Note the URL format has been adjusted to match the server route
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
    return handleApiError(error); // Ensure error is returned
  }
};

export { handleApiError };
