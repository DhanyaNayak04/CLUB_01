import React from 'react';

function EventModal({ event, onClose, onRegister, isRegistered, userRole, registrationStatus }) {
  if (!event) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 10, 40, 0.92)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '5px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <h2>{event.title}</h2>
        <p>{event.description}</p>
        <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
        <p><strong>Venue:</strong> {event.venue}</p>
        
        <div style={{ marginTop: '20px' }}>
          {/* Registration section for students */}
          {userRole === 'student' && (
            <div style={{ marginBottom: '15px' }}>
              {isRegistered ? (
                <div style={{ color: 'green', fontWeight: 'bold', marginBottom: '10px' }}>
                  ✓ You are registered for this event
                </div>
              ) : registrationStatus && !registrationStatus.canRegister ? (
                <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px' }}>
                  🔒 {
                    registrationStatus.eventPassed ? 'Event has ended' :
                    registrationStatus.registrationClosed ? 'Registration closed by coordinator' :
                    'Registration not available'
                  }
                </div>
              ) : (
                <button 
                  onClick={onRegister}
                  style={{
                    padding: '10px 15px',
                    backgroundColor: '#ffd700',
                    color: '#1a237e',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    marginBottom: '10px'
                  }}
                >
                  Register for Event
                </button>
              )}
            </div>
          )}

          <button 
            onClick={onClose}
            style={{
              padding: '8px 12px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventModal;
