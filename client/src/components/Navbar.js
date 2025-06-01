import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
      }}
    >
      {/* Left side - Login and Register */}
      <div style={{ display: 'flex', gap: '2rem' }}>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
      
      {/* Right side - Home */}
      <div>
        <Link to="/">Home</Link>
      </div>
    </nav>
  );
};

export default Navbar;