import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer style={{ 
      background: "linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)", 
      color: "white",
      padding: '2rem 1.5rem',
      textAlign: 'center',
      marginTop: 'auto',
      boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.1)"
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.25rem' }}>College Clubs Management System</h3>
          <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '0.9rem', opacity: 0.9 }}>
            Connect with clubs, participate in events, and enhance your college experience
          </p>
        </div>
        
        <div style={{ marginTop: '15px', fontSize: '0.95rem', display: 'flex', gap: '25px' }}>
          <Link to="/about" style={{ color: 'white', textDecoration: 'none' }}>About Us</Link>
          <Link to="/contact" style={{ color: 'white', textDecoration: 'none' }}>Contact</Link>
          <Link to="/privacy" style={{ color: 'white', textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
        
        <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} College Clubs Management. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
