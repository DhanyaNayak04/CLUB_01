import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  // Basic user role detection
  const getUserType = () => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        return parsedData.role || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };
  
  const userType = getUserType();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  return (
    <header style={{ 
      background: 'linear-gradient(90deg, #000a28e6 0%, #af984c 100%)', 
      color: 'white',
      padding: '0.5rem 1rem',
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
          College Clubs
        </Link>
      </div>
      
      <nav>
        <ul style={{ 
          display: 'flex',
          listStyle: 'none',
          margin: 0,
          padding: 0
        }}>
          <li style={{ margin: '0 10px' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
          </li>
          
          {!token ? (
            <>
              <li style={{ margin: '0 10px' }}>
                <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
              </li>
              <li style={{ margin: '0 10px' }}>
                <Link to="/signup" style={{ color: 'white', textDecoration: 'none' }}>Sign Up</Link>
              </li>
            </>
          ) : (
            <>
              <li style={{ margin: '0 10px' }}>
                <Link 
                  to={
                    userType === 'student' ? '/student' :
                    userType === 'coordinator' ? '/coordinator' :
                    userType === 'admin' ? '/admin' : '/'
                  } 
                  style={{ color: 'white', textDecoration: 'none' }}
                >
                  Dashboard
                </Link>
              </li>
              <li style={{ margin: '0 10px' }}>
                <button 
                  onClick={handleLogout}
                  style={{ 
                    background: 'none',
                    border: '1px solid white',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
