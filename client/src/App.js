import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import StudentDashboard from './pages/StudentDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClubDashboard from './pages/ClubDashboard';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Footer from './components/Footer';
import './App.css';

// Header always visible
function Header() {
  return (
    <header
      style={{
        background: 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)',
        color: 'white',
        padding: '1.2rem',
        textAlign: 'center',
        boxShadow: 'var(--shadow)'
      }}
    >
      <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700, letterSpacing: '1px' }}>
        College Clubs Management
      </h1>
    </header>
  );
}

const appStyles = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh'
};

const contentStyles = {
  flex: 1,
  background: 'var(--light)',
  paddingBottom: '2rem'
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={appStyles}>
          <Header />
          <div style={contentStyles}>
            <Routes>
              <Route path="/" element={
                <MainLayout>
                  <Home />
                </MainLayout>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/register" element={<SignUp />} />
              <Route path="/club/:id" element={<ClubDashboard />} />
              <Route path="/club-dashboard/:clubId" element={<ClubDashboard />} />
              <Route path="/student" element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/coordinator" element={
                <ProtectedRoute requiredRole="coordinator">
                  <CoordinatorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;