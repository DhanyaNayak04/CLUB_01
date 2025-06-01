import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

// Add AuthContext to get user info
import { useAuth } from '../contexts/AuthContext';

function ClubDashboard() {
  const { clubId, id } = useParams();
  const navigate = useNavigate();
  // Use either clubId (from /club-dashboard/:clubId) or id (from /club/:id)
  const clubParam = clubId || id;
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const [registrationStatus, setRegistrationStatus] = useState({}); // eventId: true/false/loading

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        setLoading(true);
        // Get club details
        const clubResponse = await api.get(`/api/clubs/${clubParam}`);
        setClub(clubResponse.data);

        // Get events for this club
        const eventsResponse = await api.get(`/api/events/club/${clubParam}`);
        setEvents(eventsResponse.data);

        setError(null);
      } catch (err) {
        setError('Failed to load club details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (clubParam) {
      fetchClubDetails();
    }
  }, [clubParam]);

  // Fetch registration status for all events if student
  useEffect(() => {
    const fetchRegistrationStatus = async () => {
      if (user && user.role === 'student' && events.length > 0) {
        const statusObj = {};
        for (const event of events) {
          try {
            const res = await api.get(`/api/events/${event._id}/registration-status`);
            statusObj[event._id] = res.data.isRegistered;
          } catch {
            statusObj[event._id] = false;
          }
        }
        setRegistrationStatus(statusObj);
      }
    };
    fetchRegistrationStatus();
  }, [user, events]);

  // Register handler
  const handleRegister = async (eventId) => {
    setRegistrationStatus(prev => ({ ...prev, [eventId]: 'loading' }));
    try {
      await api.post(`/api/events/${eventId}/register`);
      setRegistrationStatus(prev => ({ ...prev, [eventId]: true }));
      alert('Registered successfully!');
    } catch (err) {
      setRegistrationStatus(prev => ({ ...prev, [eventId]: false }));
      alert(err.response?.data?.message || 'Failed to register for event');
    }
  };

  // Debug: log user and registrationStatus
  // console.log('User:', user, 'RegistrationStatus:', registrationStatus);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#af984c' }}>Loading club details...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <div style={{ color: 'red', padding: '15px', backgroundColor: '#ffeeee', borderRadius: '5px' }}>
          {error}
        </div>
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => navigate('/')} style={{ color: ' #af984c', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>← Go to Home</button>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          Club not found or has been removed.
        </div>
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => navigate('/')} style={{ color: '#af984c', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>← Go to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #fff 60%, #ffd70022 100%)',
      borderRadius: '18px',
      boxShadow: '0 8px 32px 0 #1a237e22'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={{ color: '#af984c', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>← Go to Home</button>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'row', // Ensure horizontal layout on larger screens
        alignItems: 'flex-start',
        marginBottom: '30px',
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        flexWrap: 'wrap' // Allow wrapping on smaller screens
      }}>
        {/* Club Logo or Initial */}
        <div style={{
          minWidth: '100px',
          height: '100px',
          backgroundColor: '#e0e0e0',
          borderRadius: '8px',
          marginRight: '20px',
          marginBottom: '15px', // Add margin bottom for when it wraps
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '42px',
          fontWeight: 'bold',
          color: '#555',
          flexShrink: 0 // Prevent the logo from shrinking
        }}>
          {club.logoUrl ? (
            <img
              src={`${process.env.REACT_APP_API_URL || ''}${club.logoUrl}`}
              alt={`${club.name} logo`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
              onError={e => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = club.name.charAt(0);
              }}
            />
          ) : (
            club.name.charAt(0)
          )}
        </div>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>{club.name}</h1>
          {club.department && (
            <p style={{ margin: '0 0 5px 0', fontSize: '16px' }}>
              <strong>Department:</strong> {club.department}
            </p>
          )}
          <div style={{ margin: '15px 0' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.5', wordBreak: 'break-word' }}>{club.description || 'No description available.'}</p>
          </div>
        </div>
      </div>
      <h2>Upcoming Events</h2>
      {events.length === 0 ? (
        <p>No upcoming events at the moment. Check back later!</p>
      ) : (
        <div>
          {events.map(event => (
            <div
              key={event._id}
              style={{
                padding: '15px',
                marginBottom: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor: 'white'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>{event.title}</h3>
              <p style={{ margin: '5px 0' }}>
                <strong>D:</strong> {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p style={{ margin: '5px 0' }}><strong>Venue:</strong> {event.venue}</p>
              <div style={{ margin: '10px 0' }}>
                <p>{event.description}</p>
              </div>
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Registration button for students */}
                {isAuthenticated && user && user.role === 'student' && (
                  registrationStatus[event._id] === true ? (
                    <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Registered</span>
                  ) : registrationStatus[event._id] === 'loading' ? (
                    <button
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#cccccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'not-allowed'
                      }}
                      disabled
                    >
                      Registering...
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(event._id)}
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Register
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClubDashboard;
