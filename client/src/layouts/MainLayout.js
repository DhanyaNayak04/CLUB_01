import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Use the hook instead of direct context

function MainLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuth(); // Use the hook

  // Determine dashboard path based on user role
  const dashboardPath = user && user.role
    ? user.role === 'admin'
      ? '/admin'
      : user.role === 'coordinator'
        ? '/coordinator'
        : '/student'
    : '/dashboard';

  return (
    <div className="main-layout">
      <header>
        <nav style={{ 
          padding: '1rem 2rem', 
          background: 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow)'
        }}>
          {/* Home link on the left */}
          <div>
            <Link to="/" style={{ 
              color: 'white', 
              fontSize: '1.2rem', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-home"></i> Home
            </Link>
          </div>
          
          {/* Login/Register or Dashboard/Logout on the right */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {isAuthenticated && user ? (
              <>
                <Link to={dashboardPath} style={{ 
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: 'var(--border-radius)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  transition: 'background 0.2s'
                }}>
                  Dashboard
                </Link>
                <button 
                  onClick={logout} 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    border: 'none', 
                    color: 'white', 
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 'var(--border-radius)',
                    transition: 'background 0.2s'
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ 
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: 'var(--border-radius)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  transition: 'background 0.2s'
                }}>
                  Login
                </Link>
                <Link to="/register" style={{ 
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: 'var(--border-radius)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  transition: 'background 0.2s'
                }}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      
      <main style={{ padding: '1.5rem' }}>
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
