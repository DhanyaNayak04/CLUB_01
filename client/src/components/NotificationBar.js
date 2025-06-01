import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function NotificationBar({ notifications }) {
  const navigate = useNavigate();
  const [position, setPosition] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!notifications.length) return;
    
    const animate = () => {
      setPosition(prev => {
        const newPosition = prev - 1;
        if (containerRef.current && Math.abs(newPosition) > containerRef.current.scrollWidth / 2) {
          return 0;
        }
        return newPosition;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    const animationRef = { current: requestAnimationFrame(animate) };
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [notifications]);

  const handleEventClick = (event) => {
    // Navigate to club dashboard with selected event
    navigate(`/club/${event.clubId}?event=${event._id}`);
  };

  return (
    <div style={{ 
      background: '#000a28e6', 
      overflow: 'hidden', 
      whiteSpace: 'nowrap',
      marginBottom: 20,
      padding: '10px 0'
    }}>
      <div 
        ref={containerRef}
        style={{ 
          display: 'inline-block', 
          whiteSpace: 'nowrap',
          transform: `translateX(${position}px)`
        }}
      >
        {notifications.map(event => (
          <span
            key={event._id}
            style={{ 
              marginRight: 30, 
              cursor: 'pointer', 
              color: '#af984c',
              display: 'inline-block',
              background: 'linear-gradient(90deg, #af984c 60%, #000a28e6 100%)',
              padding: '5px 10px',
              borderRadius: '15px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onClick={() => handleEventClick(event)}
          >
            {event.title} ({event.clubName || 'Club Event'})
          </span>
        ))}
      </div>
    </div>
  );
}

export default NotificationBar;
