import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ClubCard from '../components/ClubCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // adjust path if needed

const Home = () => {
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const clubsContainerRef = useRef(null);
  const eventsContainerRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // get auth state

  const fetchClubs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/clubs');
      setClubs(response.data);
    } catch (err) {
      setErrorMessage("Failed to load clubs. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events/recent');
      setEvents(response.data);
      setAuthRequired(false);
      setErrorMessage(null);
    } catch (err) {
      handleEventError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to handle event errors
  const handleEventError = (err) => {
    console.log("Error fetching events:", err);
    
    if (err.response) {
      if (err.response.status === 401) {
        setAuthRequired(true);
        setErrorMessage("Authentication required to view events");
      } else if (err.response.status === 404) {
        setErrorMessage("Events feature is not available at the moment");
      } else {
        setErrorMessage(`Failed to load events: ${err.response.status} ${err.response.statusText}`);
      }
    } else {
      setErrorMessage("Failed to load events. Please try again later.");
    }
  };

  useEffect(() => {
    fetchClubs();
    fetchEvents();
  }, [fetchClubs, fetchEvents]);

  // Auto scroll events
  useEffect(() => {
    if (events.length > 0 && eventsContainerRef.current) {
      const scrollInterval = setInterval(() => {
        const container = eventsContainerRef.current;
        if (container) {
          // If we've scrolled to the bottom, reset to top
          if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
            container.scrollTop = 0;
          } else {
            // Otherwise, scroll down a bit
            container.scrollTop += 1;
          }
        }
      }, 50);

      return () => clearInterval(scrollInterval);
    }
  }, [events, loading]);

  const scrollLeft = () => {
    if (clubsContainerRef.current) {
      const newPosition = scrollPosition - 270; // Card width + margin
      clubsContainerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  const scrollRight = () => {
    if (clubsContainerRef.current) {
      const newPosition = scrollPosition + 270; // Card width + margin
      clubsContainerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  const handleScroll = () => {
    if (clubsContainerRef.current) {
      setScrollPosition(clubsContainerRef.current.scrollLeft);
    }
  };

  const handleEventClick = (event) => {
    // Navigate to the club page if clubId exists
    if (event.clubId) {
      navigate(`/club/${event.clubId}`);
    } else if (event.club && event.club._id) {
      // For cases where full club object is included
      navigate(`/club/${event.club._id}`);
    } else {
      // Fallback in case neither exists
      console.warn('No club ID available for event:', event);
      // Could show a message to the user here
    }
  };

  // Format date function
  const formatEventDate = (dateString) => {
    if (!dateString) return 'No date specified';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '30px auto', 
      padding: '20px',
      background: 'linear-gradient(135deg, #fff 60%, #af984c 100%)',
      borderRadius: '18px',
      boxShadow: '0 8px 32px 0 #000a28e6'
    }}>
      {/* Navigation or header */}
      <nav>
        {/* ...existing nav code... */}
        {isAuthenticated ? (
          <Link to="/dashboard" className="btn-primary">Dashboard</Link>
        ) : (
          <Link to="/login" className="btn-primary">Login</Link>
        )}
      </nav>

      <h2 style={{ textAlign: 'center', marginBottom: 30, color: '#512da8', letterSpacing: 2, fontWeight: 700, fontSize: '2.2rem', textShadow: '0 2px 8px #ffd70055' }}>Explore Clubs</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading clubs...</div>
      ) : (
        <div style={{ position: 'relative', padding: '0 30px' }}>
          {clubs.length > 4 && (
            <>
              <button 
                onClick={scrollLeft}
                disabled={scrollPosition <= 0}
                style={{
                  position: 'absolute',
                  left: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: scrollPosition <= 0 ? '#ccc' : '#af984c',
                  color: 'white',
                  border: 'none',
                  fontSize: '20px',
                  cursor: scrollPosition <= 0 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                ←
              </button>
              <button 
                onClick={scrollRight}
                disabled={clubsContainerRef.current && scrollPosition >= clubsContainerRef.current.scrollWidth - clubsContainerRef.current.clientWidth}
                style={{
                  position: 'absolute',
                  right: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: clubsContainerRef.current && scrollPosition >= clubsContainerRef.current.scrollWidth - clubsContainerRef.current.clientWidth ? '#ccc' : '#af984c',
                  color: 'white',
                  border: 'none',
                  fontSize: '20px',
                  cursor: clubsContainerRef.current && scrollPosition >= clubsContainerRef.current.scrollWidth - clubsContainerRef.current.clientWidth ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                →
              </button>
            </>
          )}
          <div 
            ref={clubsContainerRef}
            onScroll={handleScroll}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollbarWidth: 'none', // Hide scrollbar for Firefox
              msOverflowStyle: 'none', // Hide scrollbar for IE
              paddingBottom: '20px',
              paddingTop: '20px',
              gap: '40px', // Increased gap between cards
              scrollBehavior: 'smooth',
              justifyContent: clubs.length <= 4 ? 'center' : 'flex-start', // Center when fewer cards
            }}
          >
            {clubs.map(club => (
              <div key={club._id}>
                <ClubCard club={club} />
              </div>
            ))}
          </div>
          {/* Hide scrollbar for Chrome, Safari and Opera */}
          <style>
            {`
              div::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
        </div>
      )}

      {/* Recent Events/Notifications Section */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: '20px', 
          color: '#512da8', 
          letterSpacing: 1, 
          fontWeight: 600, 
          fontSize: '1.5rem'
        }}>
          Recent Events & Announcements
        </h3>
        
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(0, 10, 40, 0.1)',
          maxWidth: '800px',
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading events...</div>
          ) : authRequired ? (
            <div className="auth-required-container">
              <div className="auth-required-message">
                <p>You need to be logged in to view upcoming events.</p>
                <div className="auth-actions">
                  <Link to="/login" className="btn-primary">Login</Link>
                  <Link to="/register" className="btn-secondary">Register</Link>
                </div>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="error-message">
              {errorMessage}
              {errorMessage.includes("not available") && (
                <div className="error-suggestion">
                  <p>The events API endpoint may not be implemented on your server yet.</p>
                  <p>Check your server implementation or contact the developer.</p>
                </div>
              )}
            </div>
          ) : events.length === 0 ? (
            <div className="no-events">No upcoming events found</div>
          ) : (
            <div 
              ref={eventsContainerRef}
              style={{
                height: '200px',
                overflowY: 'auto',
                paddingRight: '10px',
                scrollBehavior: 'smooth'
              }}
            >
              {events.map((event) => (
                <div 
                  key={event._id}
                  onClick={() => handleEventClick(event)}
                  style={{
                    padding: '12px 16px',
                    marginBottom: '10px',
                    borderLeft: '4px solid #af984c',
                    background: '#f9f9f9',
                    borderRadius: '0 8px 8px 0',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateX(5px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{event.title}</h4>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      color: '#666',
                      background: '#eee',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatEventDate(event.date)}
                    </span>
                  </div>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: '#555' }}>
                    {event.description}
                  </p>
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '0.8rem', 
                    color: '#af984c',
                    fontWeight: '600'
                  }}>
                    {/* Handle different ways club info might be included */}
                    By: {event.clubName || (event.club && event.club.name) || 'Unknown Club'}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Fade effect at the bottom */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '40px',
            background: 'linear-gradient(to top, white, transparent)',
            pointerEvents: 'none'
          }}></div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '10px', 
          fontSize: '0.8rem', 
          color: '#666' 
        }}>
          Click on an event to view the club dashboard
        </div>
      </div>
    </div>
  );
}

export default Home;
