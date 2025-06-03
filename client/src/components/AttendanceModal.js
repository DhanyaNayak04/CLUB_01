import React, { useState, useEffect, useCallback } from 'react';
import { attendance, handleApiError } from '../utils/api';
import './AttendanceModal.css';

const AttendanceModal = ({ eventId, onClose, disabled }) => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAttendees = useCallback(async () => {
    try {      setLoading(true);
      setError('');
      const response = await attendance.getEventAttendees(eventId);
        // Transform the data to include attendance status
      // The server returns {attendees: [...], event: {...}}
      console.log('Server response:', response.data);
      
      const attendeesArray = response.data.attendees || [];
        if (!Array.isArray(attendeesArray)) {
        console.error('Response data attendees is not an array:', response.data);
        throw new Error('Unexpected response format from server');
      }
      
      const attendeesData = attendeesArray.map(attendee => ({
        ...attendee,
        isPresent: attendee.present || attendee.attendanceStatus === 'present' || false
      }));
      
      setAttendees(attendeesData);
    } catch (err) {
      console.error('Error fetching attendees:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  const handleAttendanceChange = (attendeeId, isPresent) => {
    setAttendees(prevAttendees =>
      prevAttendees.map(attendee =>
        attendee._id === attendeeId
          ? { ...attendee, isPresent }
          : attendee
      )
    );
  };  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      // Prepare attendance data - use 'present' instead of 'isPresent'
      const attendanceData = attendees.map(attendee => ({
        userId: attendee._id,
        present: attendee.isPresent
      }));

      await attendance.submitAttendance(eventId, attendanceData);
      setSuccessMessage('Attendance submitted successfully!');
      
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting attendance:', err);
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };
  const handleSaveProgress = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      // Prepare progress data - use 'userId' and 'present' as expected by server
      const progressData = attendees.map(attendee => ({
        userId: attendee._id,
        present: attendee.isPresent
      }));

      await attendance.saveProgress(eventId, progressData);
      setSuccessMessage('Progress saved successfully!');
      
      // Clear success message after a brief delay
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error saving progress:', err);
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const filteredAttendees = attendees.filter(attendee =>
    attendee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = attendees.filter(attendee => attendee.isPresent).length;

  if (disabled) {
    return null;
  }

  return (
    <div className="attendance-modal" onClick={onClose}>
      <div className="attendance-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="attendance-header">
          <h2 className="attendance-title">Mark Attendance</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="success-message" style={{ color: 'green', marginBottom: '15px' }}>
            {successMessage}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Loading attendees...
          </div>
        ) : (
          <>
            <input
              type="text"
              className="search-bar"
              placeholder="Search by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div style={{ marginBottom: '15px', fontWeight: '600' }}>
              Present: {presentCount} / {attendees.length}
            </div>

            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Student ID</th>
                  <th>Present</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.map((attendee) => (
                  <tr key={attendee._id}>
                    <td>{attendee.name || 'N/A'}</td>
                    <td>{attendee.email || 'N/A'}</td>
                    <td>{attendee.studentId || 'N/A'}</td>
                    <td>
                      <input
                        type="checkbox"
                        className="attendance-checkbox"
                        checked={attendee.isPresent}
                        onChange={(e) => handleAttendanceChange(attendee._id, e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAttendees.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                {searchTerm ? 'No attendees found matching your search.' : 'No registered attendees found.'}
              </div>
            )}            <div className="attendance-actions">
              <button className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="save-progress-button" 
                onClick={handleSaveProgress}
                disabled={saving || submitting || attendees.length === 0}
              >
                {saving ? 'Saving...' : 'Save Progress'}
              </button>
              <button 
                className="submit-button" 
                onClick={handleSubmit}
                disabled={submitting || saving || attendees.length === 0}
              >
                {submitting ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceModal;