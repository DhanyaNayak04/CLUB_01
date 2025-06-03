import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, clubs, events } from '../utils/api';

// Add AuthContext to get user info
import { useAuth } from '../contexts/AuthContext';

function ClubDashboard() {
  const { clubId, id } = useParams();
  const navigate = useNavigate();
  // Use either clubId (from /club-dashboard/:clubId) or id (from /club/:id)
  const clubParam = clubId || id;  const [club, setClub] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const [registrationStatus, setRegistrationStatus] = useState({}); // eventId: true/false/loading
  
  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching club details for clubParam:', clubParam);
        
        // Get club details
        const clubResponse = await clubs.getById(clubParam);
        console.log('Club data received:', clubResponse.data);
        setClub(clubResponse.data);

        // Get events for this club
        const eventsResponse = await events.getByClub(clubParam);
        console.log('Events data received:', eventsResponse.data);
        setClubEvents(eventsResponse.data);

        setError(null);
      } catch (err) {
        console.error('Error fetching club details:', err);
        setError('Failed to load club details. Please try again later.');      } finally {
        setLoading(false);
      }
    };

    if (clubParam) {
      fetchClubDetails();
    } else {
      setError('No club ID provided');
      setLoading(false);
    }
  }, [clubParam]);
  
  // Fetch registration status for all events if student
  useEffect(() => {
    const fetchRegistrationStatus = async () => {
      if (user && user.role === 'student' && clubEvents.length > 0) {
        console.log('Fetching registration status for', clubEvents.length, 'events'); // Debug log
        
        // Since the registration-status endpoint is not implemented, let's use a fallback approach
        const statusObj = {};
        for (const event of clubEvents) {
          try {
            // Try to get status from API first
            const res = await api.get(`/events/${event._id}/registration-status`);
            console.log(`Registration status for event ${event.title}:`, res.data); // Debug log
            statusObj[event._id] = {
              isRegistered: res.data.isRegistered || false,
              canRegister: res.data.canRegister !== undefined ? res.data.canRegister : true,
              registrationClosed: res.data.registrationClosed || false,
              attendanceCompleted: res.data.attendanceCompleted || false,
              eventPassed: res.data.eventPassed || false,
              eventDate: res.data.eventDate || event.date
            };
          } catch (error) {
            console.error(`Error fetching registration status for event ${event.title}:`, error);
            // For events where we can't get status, allow registration if event hasn't passed
            const eventDate = new Date(event.date);
            const now = new Date();
            const eventPassed = eventDate < now;
            
            statusObj[event._id] = {
              isRegistered: false,
              canRegister: !eventPassed, // Allow registration if event hasn't passed
              registrationClosed: false,
              attendanceCompleted: false,
              eventPassed: eventPassed,
              eventDate: event.date
            };
          }
        }
        console.log('Final registration status object:', statusObj); // Debug log
        setRegistrationStatus(statusObj);
      }
    };
    fetchRegistrationStatus();
  }, [user, clubEvents]);

  // Register handler
  const handleRegister = async (eventId) => {
    setRegistrationStatus(prev => ({ 
      ...prev,      [eventId]: { 
        ...prev[eventId], 
        isRegistered: 'loading'
      }
    }));
    try {
      await events.register(eventId);
      setRegistrationStatus(prev => ({
        ...prev, 
        [eventId]: { 
          ...prev[eventId], 
          isRegistered: true,
          canRegister: false 
        } 
      }));
      alert('Registered successfully!');
    } catch (err) {
      setRegistrationStatus(prev => ({ 
        ...prev, 
        [eventId]: { 
          ...prev[eventId], 
          isRegistered: false 
        } 
      }));
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
      </div>      <h2>Upcoming Events</h2>
      {clubEvents.length === 0 ? (
        <p>No upcoming events at the moment. Check back later!</p>
      ) : (
        <div>
          {clubEvents.map(event => (
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
                  (() => {
                    const status = registrationStatus[event._id];
                    console.log(`Rendering event ${event.title} with status:`, status); // Debug log
                    
                    if (!status) return <span style={{ color: 'gray' }}>Loading registration status...</span>;

                    if (status.isRegistered === true) {
                      return <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Registered</span>;
                    }

                    if (status.isRegistered === 'loading') {
                      return (
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
                      );
                    }

                    // Check if event has passed (client-side check as fallback)
                    const eventDate = new Date(event.date);
                    const now = new Date();
                    const isEventPassed = eventDate < now;

                    if (isEventPassed) {
                      return (
                        <span style={{ color: 'red', fontWeight: 'bold' }}>
                          🔒 Event has ended
                        </span>
                      );
                    }

                    if (!status.canRegister) {
                      let message = 'Registration not available';
                      if (status.eventPassed) {
                        message = 'Event has ended';
                      } else if (status.registrationClosed) {
                        message = 'Registration closed by coordinator';
                      }

                      return (
                        <span style={{ color: 'red', fontWeight: 'bold' }}>
                          🔒 {message}
                        </span>
                      );
                    }

                    return (
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
                    );
                  })()
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
