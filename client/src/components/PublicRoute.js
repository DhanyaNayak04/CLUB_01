import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  
  // If user is already authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" />;
    } else if (user.role === 'coordinator') {
      return <Navigate to="/coordinator" />;
    } else if (user.role === 'student') {
      return <Navigate to="/student" />;
    }
  }
  
  // Not authenticated, show the requested page
  return children;
}

export default PublicRoute;
