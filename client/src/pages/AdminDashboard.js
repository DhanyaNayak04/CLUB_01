import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';
import ClubForm from '../components/ClubForm';

function AdminDashboard() {
  const [coordinatorRequests, setCoordinatorRequests] = useState([]);
  const [venueRequests, setVenueRequests] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('coordinator');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        // Fetch coordinator requests
        const coordinatorRes = await api.get('/api/users/coordinator-requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCoordinatorRequests(coordinatorRes.data);

        // Fetch venue requests
        const venueRes = await api.get('/api/admin/venue-requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVenueRequests(venueRes.data);

        // Fetch clubs
        const clubsRes = await api.get('/api/clubs');
        setClubs(clubsRes.data);

        setError('');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Handle coordinator approval
  const handleApproveCoordinator = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      await api.post(`/api/users/approve-coordinator/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoordinatorRequests(coordinatorRequests.filter(r => r._id !== userId));
      alert('Coordinator approved successfully');
    } catch (err) {
      console.error('Error approving coordinator:', err);
      setError('Failed to approve coordinator.');
    }
  };

  // Handle coordinator rejection
  const handleRejectCoordinator = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      await api.post(`/api/users/reject-coordinator/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoordinatorRequests(coordinatorRequests.filter(r => r._id !== userId));
      alert('Coordinator request rejected');
    } catch (err) {
      console.error('Error rejecting coordinator:', err);
      setError('Failed to reject coordinator.');
    }
  };

  // Handle venue approval
  const handleApproveVenue = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      setError(''); // Clear previous errors

      // Show loading state
      const updatingRequests = venueRequests.map(req => 
        req._id === requestId ? { ...req, isUpdating: true } : req
      );
      setVenueRequests(updatingRequests);

      // Make API call
      const response = await api.post(`/api/admin/approve-venue/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update state with result
      setVenueRequests(venueRequests.map(req => 
        req._id === requestId ? { ...req, approved: true, isUpdating: false } : req
      ));

      alert(`Venue request approved: ${response.data.message}`);
    } catch (err) {
      console.error('Error approving venue request:', err);

      // Remove loading state from failed request
      setVenueRequests(venueRequests.map(req => 
        req._id === requestId ? { ...req, isUpdating: false } : req
      ));

      setError(`Failed to approve venue request: ${err.response?.data?.message || err.message}`);
    }
  };

  // Handle venue rejection
  const handleRejectVenue = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      setError(''); // Clear previous errors

      // Show loading state
      const updatingRequests = venueRequests.map(req => 
        req._id === requestId ? { ...req, isUpdating: true } : req
      );
      setVenueRequests(updatingRequests);

      // Make API call
      await api.post(`/api/admin/reject-venue/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove the rejected request from state
      setVenueRequests(venueRequests.filter(req => req._id !== requestId));

      alert('Venue request rejected');
    } catch (err) {
      console.error('Error rejecting venue request:', err);

      // Remove loading state from failed request
      setVenueRequests(venueRequests.map(req => 
        req._id === requestId ? { ...req, isUpdating: false } : req
      ));

      setError(`Failed to reject venue request: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #fff 60%, #af984c 100%)',
      borderRadius: '18px',
      boxShadow: '0 8px 32px 0 #000a28e6'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Admin Dashboard</h2>
        <LogoutButton />
      </div>
      
      {error && <div style={{ color: 'red', marginBottom: 15, padding: 10, backgroundColor: '#ffeeee', borderRadius: 5 }}>{error}</div>}
      
      {/* Tabs navigation */}
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button 
          onClick={() => setActiveTab('coordinator')} 
          style={{ 
            padding: '10px 20px', 
            border: 'none',
            background: activeTab === 'coordinator' ? '#4CAF50' : '#f1f1f1',
            color: activeTab === 'coordinator' ? 'white' : 'black',
            cursor: 'pointer',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px',
            marginRight: '5px'
          }}
        >
          Coordinator Requests
        </button>
        <button 
          onClick={() => setActiveTab('venue')} 
          style={{ 
            padding: '10px 20px', 
            border: 'none', 
            background: activeTab === 'venue' ? '#4CAF50' : '#f1f1f1',
            color: activeTab === 'venue' ? 'white' : 'black',
            cursor: 'pointer',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px',
            marginRight: '5px'
          }}
        >
          Venue Requests
        </button>
        <button 
          onClick={() => setActiveTab('clubs')} 
          style={{ 
            padding: '10px 20px', 
            border: 'none', 
            background: activeTab === 'clubs' ? '#4CAF50' : '#f1f1f1',
            color: activeTab === 'clubs' ? 'white' : 'black',
            cursor: 'pointer',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px'
          }}
        >
          Manage Clubs
        </button>
      </div>
      
      {/* Coordinator requests tab */}
      {activeTab === 'coordinator' && (
        <div>
          <h3>Coordinator Signup Requests</h3>
          {loading ? (
            <p>Loading coordinator requests...</p>
          ) : coordinatorRequests.length === 0 ? (
            <p>No pending coordinator requests.</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {coordinatorRequests.map(req => (
                <li key={req._id} style={{ padding: '15px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                  <h4>{req.name}</h4>
                  <p><strong>Email:</strong> {req.email}</p>
                  <p><strong>Club:</strong> {req.clubName}</p>
                  <p><strong>Year of Study:</strong> {req.year}</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleApproveCoordinator(req._id)} 
                      style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#4CAF50', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRejectCoordinator(req._id)} 
                      style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f44336', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {/* Venue requests tab */}
      {activeTab === 'venue' && (
        <div>
          <h3>Venue Requests</h3>
          {loading ? (
            <p>Loading venue requests...</p>
          ) : venueRequests.length === 0 ? (
            <p>No pending venue requests.</p>
          ) : (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Event Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Club</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Venue</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {venueRequests.map(req => (
                    <tr key={req._id} style={{ backgroundColor: req.approved ? '#e8f5e9' : 'white' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                        <strong>{req.eventName}</strong>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>{req.eventDescription}</div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                        {req.clubName}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{req.venue}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                        {new Date(req.eventDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                        {req.timeFrom} - {req.timeTo}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                        {!req.approved ? (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              onClick={() => handleApproveVenue(req._id)}
                              disabled={req.isUpdating}
                              style={{ 
                                padding: '8px 12px', 
                                backgroundColor: req.isUpdating ? '#cccccc' : '#4CAF50', 
                                color: 'white', 
                                border: 'none', 
                                cursor: req.isUpdating ? 'default' : 'pointer',
                                borderRadius: '4px'
                              }}
                            >
                              {req.isUpdating ? 'Processing...' : 'Approve'}
                            </button>
                            <button 
                              onClick={() => handleRejectVenue(req._id)}
                              disabled={req.isUpdating}
                              style={{ 
                                padding: '8px 12px', 
                                backgroundColor: req.isUpdating ? '#cccccc' : '#f44336',
                                color: 'white', 
                                border: 'none', 
                                cursor: req.isUpdating ? 'default' : 'pointer',
                                borderRadius: '4px'
                              }}
                            >
                              {req.isUpdating ? 'Processing...' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Approved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Clubs tab */}
      {activeTab === 'clubs' && (
        <div>
          <h3>Manage Clubs</h3>
          
          {/* Create new club form */}
          <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <h3>Create New Club</h3>
            <ClubForm
              onSuccess={(data) => {
                alert(`Club "${data.club.name}" created successfully!`);
                // Refresh clubs list if you have one
              }}
            />
          </div>
          
          {/* Existing clubs list */}
          <h4>Existing Clubs</h4>
          {loading ? (
            <p>Loading clubs...</p>
          ) : clubs.length === 0 ? (
            <p>No clubs created yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {clubs.map(club => (
                <div key={club._id} style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '15px' }}>
                  <div style={{ height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                    {club.logoUrl ? (
                      <img 
                        src={club.logoUrl} 
                        alt={`${club.name} logo`}
                        style={{ maxWidth: '100%', maxHeight: '100px' }}
                      />
                    ) : (
                      <div style={{ width: '100px', height: '100px', backgroundColor: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        No Logo
                      </div>
                    )}
                  </div>
                  <h4 style={{ margin: '10px 0', textAlign: 'center' }}>{club.name}</h4>
                  <p style={{ fontSize: '0.9em', color: '#666' }}>
                    {club.description.length > 100
                      ? `${club.description.substring(0, 100)}...`
                      : club.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
