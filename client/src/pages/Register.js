import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    clubName: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Create payload based on role
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      // Add additional fields based on role
      if (formData.role === 'student') {
        payload.department = formData.department;
      } else if (formData.role === 'coordinator') {
        payload.clubName = formData.clubName;
      }

      const response = await api.post('/auth/register', payload);

      setSuccess(response.data.message || 'Registration successful!');

      // Redirect based on role
      if (formData.role === 'student') {
        // Students can login immediately
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (formData.role === 'coordinator') {
        // Coordinators need approval
        setTimeout(() => {
          navigate('/coordinator-pending');
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 500, 
      margin: '40px auto', 
      padding: 28, 
      borderRadius: 16,
      background: 'linear-gradient(135deg, #fff 60%, #af984c 100%)',
      boxShadow: '0 8px 32px 0 #000a28e6',
      border: '2px solid #af984c'
    }}>
      <h2>Register</h2>
      {error && <div style={{ color: 'red', marginBottom: 15 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 15 }}>{success}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label>Name:</label><br />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Email:</label><br />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Password:</label><br />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Confirm Password:</label><br />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Role:</label><br />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="student">Student</option>
            <option value="coordinator">Coordinator</option>
          </select>
        </div>

        {formData.role === 'student' && (
          <div style={{ marginBottom: 15 }}>
            <label>Department:</label><br />
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        )}

        {formData.role === 'coordinator' && (
          <div style={{ marginBottom: 15 }}>
            <label>Club Name:</label><br />
            <input
              type="text"
              name="clubName"
              value={formData.clubName}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none' }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: 15 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;
