import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '70vh',
      textAlign: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #fff 60%, #af984c 100%)',
      borderRadius: '18px',
      boxShadow: '0 8px 32px 0 #000a28e6'
    }}>
      <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>404</h1>
      <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Page Not Found</h2>
      <p style={{ marginBottom: '30px' }}>The page you are looking for doesn't exist or has been moved.</p>
      <Link 
        to="/" 
        style={{
          padding: '10px 20px',
          backgroundColor: '#2196F3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}
      >
        Go to Home
      </Link>
    </div>
  );
}

export default NotFound;
