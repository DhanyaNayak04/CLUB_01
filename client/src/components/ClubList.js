import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [year, setYear] = useState('');
  const [clubName, setClubName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch available clubs when component mounts
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/clubs');
        setClubs(response.data);
      } catch (err) {
        console.error('Error fetching clubs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Reset messages
      setError('');
      setSuccess('');
      
      const payload = { name, email, password, role };
      
      // Add additional fields for coordinator
      if (role === 'coordinator') {
        if (!year || !clubName) {
          setError('Year of study and club name are required for coordinators');
          return;
        }
        payload.year = year;
        payload.clubName = clubName;
      }
      
      const res = await api.post('/api/auth/signup', payload);
      setSuccess(res.data.message);
      
      if (role === 'student') {
        // Students can directly login
        setTimeout(() => navigate('/login'), 2000);
      }
      // Coordinators need approval, so we keep them on this page with the success message
      
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '2rem auto', 
      padding: '2rem', 
      borderRadius: 16,
      background: 'linear-gradient(135deg, #fff 60%, #af984c 100%)',
      boxShadow: '0 8px 32px 0 #000a28e6',
      border: '2px solid #af984c'
    }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#512da8', fontWeight: 700 }}>Sign Up</h2>
        <Link to="/" style={{ color: '#af984c', textDecoration: 'none' }}>← Go to Home</Link>
      </div>
      
      {success && <div style={{ color: 'green', marginBottom: 15 }}>{success}</div>}
      {error && <div style={{ color: 'red', marginBottom: 15 }}>{error}</div>}
      
      <form onSubmit={handleSignup}>
        <div style={{ marginBottom: 10 }}>
          <label>Name:</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: 10 }}>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: 10 }}>
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: 10 }}>
          <label>Role:</label>
          <select 
            value={role} 
            onChange={e => setRole(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="student">Student</option>
            <option value="coordinator">Coordinator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        {role === 'coordinator' && (
          <>
            <div style={{ marginBottom: 10 }}>
              <label>Year of Study:</label>
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                required
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 10 }}>
              <label>Club Name:</label>
              {loading ? (
                <p>Loading clubs...</p>
              ) : (
                <select
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">Select Club</option>
                  {clubs.map(club => (
                    <option key={club._id} value={club.name}>
                      {club.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </>
        )}
        
        <button 
          type="submit"
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#af984c', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Sign Up
        </button>
      </form>
      
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <p>Already have an account? <Link to="/login" style={{ color: '#af984c' }}>Login here</Link></p>
      </div>

      <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '20px',               // Consistent spacing between cards
  padding: '20px',
}}>
  {clubs.map(club => (
    <ClubCard key={club._id} club={club} /> // Or however your card component is structured
  ))}
</div>
    </div>
  );
}

export default SignUp;