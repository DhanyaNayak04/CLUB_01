import React, { useState, useEffect } from 'react';
import { 
  getEventAttendees, 
  submitAttendance, 
  saveAttendanceProgress
} from '../services/api';
import './AttendanceModal.css';

const AttendanceModal = ({ eventId, onClose, disabled }) => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attendanceCompleted, setAttendanceCompleted] = useState(false);

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        setLoading(true);
        // Use eventId directly
        const data = await getEventAttendees(eventId);

        // Extract event title if available in the response
        if (data.event && data.event.title) {
          setEventTitle(data.event.title);
        }
        // Check if attendance is completed
        if (data.event && data.event.attendanceCompleted) {
          setAttendanceCompleted(true);
        }

        // Set attendees from the response
        const attendeesList = Array.isArray(data) ? data : 
                             (data.attendees ? data.attendees : []);

        setAttendees(attendeesList.map(attendee => ({
          ...attendee,
          present: attendee.present || false
        })));

        setLoading(false);
      } catch (err) {
        console.error('Error fetching attendees:', err);
        setError('Failed to load attendees: ' + (err.message || ''));
        setLoading(false);
      }
    };

    fetchAttendees();
  }, [eventId]);

  const handleAttendanceChange = (id, isPresent) => {
    setAttendees(prevAttendees => 
      prevAttendees.map(attendee => 
        attendee._id === id ? { ...attendee, present: isPresent } : attendee
      )
    );
    // Auto-save when changes are made
    autoSaveAttendance();
  };

  // Debounce auto-save to avoid too many requests
  let autoSaveTimer = null;
  const autoSaveAttendance = () => {
    setSaved(false);
    
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    autoSaveTimer = setTimeout(() => {
      handleSaveProgress();
    }, 2000); // 2 second delay
  };

  const handleSaveProgress = async () => {
    try {
      setSaving(true);
      
      await saveAttendanceProgress(
        eventId, 
        attendees.map(({ _id, present }) => ({ userId: _id, present }))
      );
      
      setSaving(false);
      setSaved(true);
      
      // Hide "Saved" message after 3 seconds
      setTimeout(() => {
        setSaved(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error saving attendance progress:', err);
      setSaving(false);
      setError('Failed to save progress: ' + (err.message || ''));
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitStatus('submitting');
      
      // Ensure attendees are mapped to { userId, present }
      const payload = attendees.map(({ _id, present }) => ({
        userId: _id,
        present: !!present
      }));

      console.log('Submitting attendance data:', {
        eventId: eventId,
        attendees: payload
      });
      
      await submitAttendance(eventId, payload);
      
      setSubmitStatus('success');
      
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting attendance:', err);
      setSubmitStatus('error');
      setError(err.message || 'Failed to submit attendance');
    }
  };

  const filteredAttendees = attendees.filter(attendee => 
    attendee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attendee.department && attendee.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="attendance-modal">
      <div className="attendance-modal-content">
        <div className="attendance-header">
          <h2 className="attendance-title">Take Attendance: {eventTitle || 'Event'}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        {attendanceCompleted || disabled ? (
          <p className="success-message">Attendance has already been submitted for this event. You cannot take attendance again.</p>
        ) : loading ? (
          <p>Loading attendees...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <>
            <input
              type="text"
              className="search-bar"
              placeholder="Search by name, email or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {filteredAttendees.length === 0 ? (
              <p>No registered students found for this event.</p>
            ) : (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Present</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendees.map(attendee => (
                    <tr key={attendee._id}>
                      <td>{attendee.name}</td>
                      <td>{attendee.email}</td>
                      <td>{attendee.department || 'N/A'}</td>
                      <td>
                        <input
                          type="checkbox"
                          className="attendance-checkbox"
                          checked={attendee.present}
                          onChange={(e) => handleAttendanceChange(attendee._id, e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            <div className="save-status">
              {saving && <span className="saving-message">Saving...</span>}
              {saved && <span className="saved-message">Progress saved!</span>}
            </div>
            
            <div className="attendance-actions">
              <button className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="save-button" 
                onClick={handleSaveProgress}
                disabled={saving || submitStatus === 'submitting'}
              >
                {saving ? 'Saving...' : 'Save Progress'}
              </button>
              <button 
                className="submit-button" 
                onClick={handleSubmit}
                disabled={submitStatus === 'submitting'}
              >
                {submitStatus === 'submitting' ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </div>
            
            {submitStatus === 'success' && (
              <p className="success-message">
                Attendance submitted successfully!
              </p>
            )}
            
            {submitStatus === 'error' && (
              <p className="error-message">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceModal;
