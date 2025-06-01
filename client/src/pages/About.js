import React from 'react';
import { useNavigate } from 'react-router-dom';

function About() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <h2>About College Club Management System</h2>
      
      <p>
        The College Club Management System is a comprehensive platform designed to streamline 
        the management and participation in various college clubs.
      </p>
      
      <h3>Key Features</h3>
      <ul>
        <li>Club discovery and information</li>
        <li>Event announcements and registration</li>
        <li>Venue booking for club activities</li>
        <li>Attendance tracking for events</li>
        <li>Certificate generation for participants</li>
        <li>Role-based access (Admin, Coordinator, Student)</li>
      </ul>
      
      <h3>User Roles</h3>
      <div>
        <h4>Admin</h4>
        <p>
          Admins can approve coordinator requests and manage venue bookings. 
          Only designated email addresses can register as admin.
        </p>
        
        <h4>Coordinator</h4>
        <p>
          Club coordinators can request venues, post events, and track attendance.
          Coordinator accounts require admin approval.
        </p>
        
        <h4>Student</h4>
        <p>
          Students can browse clubs, register for events, and access their certificates
          after participation.
        </p>
      </div>
      
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
}

export default About;
