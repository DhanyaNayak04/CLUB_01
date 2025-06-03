import React, { useEffect, useState } from 'react';
import { api, attendance, users, events as eventsAPI, clubs } from '../utils/api';
import LogoutButton from '../components/LogoutButton';
import AttendanceModal from '../components/AttendanceModal';
import Certificate from '../components/Certificate';

// Add CoordinatorProfile inline (or import if you move to a separate file)
function CoordinatorProfile({ profile, onProfilePicChange }) {
  const apiBase = process.env.REACT_APP_API_URL || '';
  const [profilePicPreview, setProfilePicPreview] = useState(
    profile.profilePic
      ? profile.profilePic.startsWith('http')
        ? profile.profilePic
        : apiBase + profile.profilePic
      : null
  );

  // Update preview if profile.profilePic changes (e.g., after refresh)
  React.useEffect(() => {
    if (profile.profilePic) {
      setProfilePicPreview(
        profile.profilePic.startsWith('http')
          ? profile.profilePic
          : apiBase + profile.profilePic
      );
    }
  }, [profile.profilePic, apiBase]);

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
        onProfilePicChange(file, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f9f9f9', borderRadius: 8, maxWidth: 400, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 20 }}>My Profile</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
        <img
          src={profilePicPreview || '/default-profile.png'}
          alt="Profile"
          style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 10, border: '2px solid #af984c' }}
        />
        <input type="file" accept="image/*" onChange={handlePicChange} />
      </div>
      <div>
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Contact Number:</strong> {profile.contactNumber || '-'}</p>
        <p><strong>Email:</strong> {profile.email}</p>
      </div>
    </div>
  );
}

function CoordinatorDashboard() {
  const [coordinatorEvents, setCoordinatorEvents] = useState([]);
  const [venueRequest, setVenueRequest] = useState({
    venue: '',
    eventName: '',
    eventDate: '',
    timeFrom: '',
    timeTo: '',
    eventDescription: ''
  });
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    venueRequestId: ''
  });
  const [pendingVenueRequests, setPendingVenueRequests] = useState([]);
  const [approvedVenues, setApprovedVenues] = useState([]);
  const [club, setClub] = useState(null);
  const [editingClub, setEditingClub] = useState(false);
  const [clubDescription, setClubDescription] = useState('');
  const [updatingDescription, setUpdatingDescription] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [attendanceEventId, setAttendanceEventId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedEventForCertificate, setSelectedEventForCertificate] = useState(null);
  const [activeTab, setActiveTab] = useState('club');
  // Add profile state
  const [profile, setProfile] = useState({});
  // Add state for submit/generate loading
  const [submittingEventId, setSubmittingEventId] = useState(null);
  // Add state for close registration loading
  const [closingRegistrationEventId, setClosingRegistrationEventId] = useState(null);
  const fetchVenueRequests = async () => {
    try {
      console.log('Fetching venue requests...');
      const res = await api.get('/events/venue-requests');
      console.log('Venue requests data:', res.data);

      const approved = [];
      const pending = [];

      res.data.forEach(req => {
        console.log(`Request ${req._id} approval status:`, req.approved);
        if (req.approved === true) {
          approved.push(req);
        } else {
          pending.push(req);
        }
      });

      console.log(`Sorted ${approved.length} approved and ${pending.length} pending requests`);
      setApprovedVenues(approved);
      setPendingVenueRequests(pending);
    } catch (error) {
      console.error('Error fetching venue requests:', error);
    }
  };
  // When fetching events, also fetch registered students for each event
  const fetchEvents = async () => {
    try {
      // Fetch only events published by the logged-in coordinator
      const eventsResponse = await api.get('/events/my');
      const eventsWithRegistrations = await Promise.all(
        eventsResponse.data.map(async (event) => {
          // Fetch registered students for each event
          const registrationsRes = await api.get(`/events/${event._id}/registrations`);
          return { ...event, registrations: registrationsRes.data };
        })
      );
      setCoordinatorEvents(eventsWithRegistrations);
    } catch (err) {
      console.error('Failed to load events or registrations.', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user profile first to access club ID
        const profileResponse = await api.get('/users/me');
        setProfile(profileResponse.data);
        console.log('Coordinator profile:', profileResponse.data);
        
        // Debug club information from profile
        console.log('Club data from profile:', {
          clubId: profileResponse.data.clubId,
          club: profileResponse.data.club,
          clubName: profileResponse.data.clubName
        });
        
        // Check if club is associated
        if (!profileResponse.data.club && profileResponse.data.clubName) {
          console.warn('Coordinator has clubName but no club reference:', profileResponse.data.clubName);
        }

        if (profileResponse.data && profileResponse.data.club) {
          const clubRes = await clubs.getById(profileResponse.data.club._id);
          setClub(clubRes.data);
          setClubDescription(clubRes.data.description || '');
          console.log('Club data loaded:', clubRes.data);

          // Fetch only coordinator's events
          await fetchEvents();
        } else {
          // No club association found for coordinator
          setClub(null);
          await fetchEvents();
        }

        await fetchVenueRequests();
      } catch (error) {
        console.error('Error fetching coordinator data:', error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const handleVenueRequestChange = (e) => {
    const { name, value } = e.target;
    setVenueRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVenueRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events/request-venue', venueRequest);
      alert('Venue request sent to admin!');
      setVenueRequest({
        venue: '',
        eventName: '',
        eventDate: '',
        timeFrom: '',
        timeTo: '',
        eventDescription: ''
      });

      await fetchVenueRequests();
    } catch (error) {
      alert('Failed to send venue request');
      console.error('Venue request error:', error);
    }
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePostEvent = async (e) => {
    e.preventDefault();
    try {
      if (!eventForm.venueRequestId) {
        alert('Please select an approved venue');
        return;
      }

      if (!eventForm.title || !eventForm.description) {
        alert('Please fill in all required fields');
        return;
      }

      // Find selected venue for debugging
      const selectedVenue = approvedVenues.find(v => v._id === eventForm.venueRequestId);
      console.log('Selected venue for event:', selectedVenue);

      // Prepare payload
      const eventData = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        venueRequestId: eventForm.venueRequestId,
      };      // Add date if specified
      if (eventForm.date) {
        eventData.date = eventForm.date;
      }
      
      console.log('Sending event data:', eventData);
      
      // Make API request using events helper
      const response = await eventsAPI.create(eventData);
      
      console.log('Event created successfully:', response.data);
      
      // Reset form
      setEventForm({
        title: '',
        description: '',
        date: '',
        venueRequestId: ''
      });
      
      alert('Event posted successfully!');
      
      // Refresh events list
      await fetchEvents();
    } catch (error) {
      console.error('Error posting event:', error);
      
      let errorMessage = 'Failed to create event';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };
  // Fix the handleUpdateClubDescription function
  const handleUpdateClubDescription = async (e) => {
    e.preventDefault();
    setUpdatingDescription(true);
    try {
      console.log('Updating club description:', clubDescription);
      
      if (!club || !club._id) {
        throw new Error('No club associated with your account');
      }
      
      console.log('Club info for update:', club);
      const response = await clubs.updateDescription(clubDescription);
      console.log('Club update response:', response.data);

      // Update the local state with the response data
      setClub(response.data.club);
      setEditingClub(false);
      alert('Club description updated successfully');
    } catch (error) {
      console.error('Error updating club description:', error);
      
      let errorMessage = 'Failed to update club description';
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setUpdatingDescription(false);
    }
  };

  // Fix 1: Remove unused function or add eslint disable comment
  // eslint-disable-next-line no-unused-vars
  const handleGenerateCertificate = (student, event) => {
    setSelectedStudent(student);
    setSelectedEventForCertificate(event);
    setShowCertificate(true);
  };
  // Fix 2: Update handleAttendance to send the correct request
  const handleAttendance = (eventId) => {
    console.log(`Opening attendance modal for event ID: ${eventId}`);
    setAttendanceEventId(eventId);
    setShowAttendanceModal(true);
  };

  // Handler for profile picture upload
  const handleProfilePicChange = async (file, preview) => {
    try {
      const formData = new FormData();
      formData.append('profilePic', file);
      const res = await users.uploadProfilePic(formData);
      setProfile(prev => ({ ...prev, profilePic: res.data.profilePicUrl }));
    } catch (err) {
      alert('Failed to upload profile picture');
    }
  };
  // Handler for "Submit & Generate Certificates"
  const handleSubmitAndGenerate = async (eventId) => {
    setSubmittingEventId(eventId);
    try {
      // Fetch latest attendees (with present status)
      const data = await attendance.getEventAttendees(eventId);
      const attendees = (data.attendees || []).map(({ _id, present }) => ({ userId: _id, present }));

      // Submit attendance and generate certificates
      await attendance.submitAttendance(eventId, attendees);

      alert('Attendance submitted and certificates generated/sent!');
      await fetchEvents();
    } catch (err) {
      alert('Failed to submit attendance and generate certificates.');
      console.error(err);
    } finally {
      setSubmittingEventId(null);
    }
  };

  // Handler for closing registration
  const handleCloseRegistration = async (eventId) => {
    if (!window.confirm('Are you sure you want to close registration for this event? This action cannot be undone.')) {
      return;
    }    setClosingRegistrationEventId(eventId);
    try {
      await attendance.closeRegistration(eventId);
      alert('Registration closed successfully!');
      await fetchEvents(); // Refresh events list
    } catch (err) {
      alert('Failed to close registration: ' + (err.message || 'Unknown error'));
      console.error(err);
    } finally {
      setClosingRegistrationEventId(null);
    }
  };

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #fff 60%, #ffd70022 100%)',
      borderRadius: '18px',
      boxShadow: '0 8px 32px 0 #1a237e22'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Coordinator Dashboard</h2>
        <LogoutButton />
      </div>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'profile' ? '#af984c' : '#f1f1f1',
            color: activeTab === 'profile' ? 'white' : 'black',
            cursor: 'pointer',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px',
            marginRight: '5px'
          }}
        >
          My Profile
        </button>
        <button
          onClick={() => setActiveTab('club')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'club' ? '#af984c' : '#f1f1f1',
            color: activeTab === 'club' ? 'white' : 'black',
            cursor: 'pointer',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px',
            marginRight: '5px'
          }}
        >
          Club Info
        </button>
        <button
          onClick={() => setActiveTab('venue')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'venue' ? '#af984c' : '#f1f1f1',
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
          onClick={() => setActiveTab('post')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'post' ? '#af984c' : '#f1f1f1',
            color: activeTab === 'post' ? 'white' : 'black',
            cursor: 'pointer',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px',
            marginRight: '5px'
          }}
        >
          Post Event
        </button>
        <button
          onClick={() => setActiveTab('events')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'events' ? '#af984c' : '#f1f1f1',
            color: activeTab === 'events' ? 'white' : 'black',
            cursor: 'pointer',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px'
          }}
        >
          My Events
        </button>
      </div>

      {/* My Profile Tab */}
      {activeTab === 'profile' && (
        <CoordinatorProfile profile={profile} onProfilePicChange={handleProfilePicChange} />
      )}

      {/* Club Info Tab */}
      {activeTab === 'club' && club && (
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Your Club: {club.name}</h3>
            <button 
              onClick={() => setEditingClub(!editingClub)}
              style={{ 
                padding: '5px 10px', 
                backgroundColor: '#af984c', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {editingClub ? 'Cancel' : 'Edit Description'}
            </button>
          </div>
          {editingClub ? (
            <form onSubmit={handleUpdateClubDescription}>
              <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Club Description:</label>
                <textarea
                  style={{ width: '100%', padding: '8px', height: '100px' }}
                  value={clubDescription}
                  onChange={(e) => setClubDescription(e.target.value)}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={updatingDescription}
                style={{ 
                  padding: '8px 15px', 
                  backgroundColor: updatingDescription ? '#cccccc' : '#4CAF50', 
                  color: 'white', 
                  border: 'none', 
                  cursor: updatingDescription ? 'not-allowed' : 'pointer',
                  borderRadius: '4px'
                }}
              >
                {updatingDescription ? 'Updating...' : 'Update Description'}
              </button>
            </form>
          ) : (
            <>
              <p><strong>Department:</strong> {club.department || 'N/A'}</p>
              <p><strong>Description:</strong> {club.description || 'No description available.'}</p>
            </>
          )}
        </div>
      )}

      {/* Venue Requests Tab */}
      {activeTab === 'venue' && (
        <div>
          <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3>Request for Venue</h3>
            <form onSubmit={handleVenueRequest}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Event Name:</label>
                <input
                  style={{ width: '100%', padding: '8px' }}
                  type="text"
                  name="eventName"
                  value={venueRequest.eventName}
                  onChange={handleVenueRequestChange}
                  required
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Venue:</label>
                <input
                  style={{ width: '100%', padding: '8px' }}
                  type="text"
                  name="venue"
                  value={venueRequest.venue}
                  onChange={handleVenueRequestChange}
                  required
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Date:</label>
                <input
                  style={{ width: '100%', padding: '8px' }}
                  type="date"
                  name="eventDate"
                  value={venueRequest.eventDate}
                  onChange={handleVenueRequestChange}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>From:</label>
                  <input
                    style={{ width: '100%', padding: '8px' }}
                    type="time"
                    name="timeFrom"
                    value={venueRequest.timeFrom}
                    onChange={handleVenueRequestChange}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>To:</label>
                  <input
                    style={{ width: '100%', padding: '8px' }}
                    type="time"
                    name="timeTo"
                    value={venueRequest.timeTo}
                    onChange={handleVenueRequestChange}
                    required
                  />
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
                <textarea
                  style={{ width: '100%', padding: '8px', height: '100px' }}
                  name="eventDescription"
                  value={venueRequest.eventDescription}
                  onChange={handleVenueRequestChange}
                  required
                ></textarea>
              </div>
              <button
                style={{ padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
                type="submit"
              >
                Request Venue
              </button>
            </form>
          </div>
          {pendingVenueRequests.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3>Pending Venue Requests</h3>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {pendingVenueRequests.map(req => (
                  <li key={req._id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    <strong>{req.eventName}</strong> at {req.venue} on {new Date(req.eventDate).toLocaleDateString()}
                    <span style={{ marginLeft: '10px', color: 'orange', fontWeight: 'bold' }}>
                      Pending
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {approvedVenues.length > 0 && (
            <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9fff9' }}>
              <h3>Approved Venues</h3>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {approvedVenues.map(venue => (
                  <li key={venue._id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    <strong>{venue.eventName}</strong> at {venue.venue} on {new Date(venue.eventDate).toLocaleDateString()}
                    <span style={{ marginLeft: '10px', color: 'green', fontWeight: 'bold' }}>
                      Approved
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Post Event Tab */}
      {activeTab === 'post' && approvedVenues.length > 0 && (
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9fff9' }}>
          <h3>Post Event (Approved Venues)</h3>
          <form onSubmit={handlePostEvent}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Select Approved Venue:</label>
              <select
                style={{ width: '100%', padding: '8px' }}
                name="venueRequestId"
                value={eventForm.venueRequestId}
                onChange={handleEventFormChange}
                required
              >
                <option value="">-- Select an approved venue --</option>
                {approvedVenues.map(venue => (
                  <option key={venue._id} value={venue._id}>
                    {venue.eventName} at {venue.venue} ({new Date(venue.eventDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Title:</label>
              <input
                style={{ width: '100%', padding: '8px' }}
                type="text"
                name="title"
                value={eventForm.title}
                onChange={handleEventFormChange}
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
              <textarea
                style={{ width: '100%', padding: '8px', height: '100px' }}
                name="description"
                value={eventForm.description}
                onChange={handleEventFormChange}
                required
              ></textarea>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Date & Time (Optional - defaults to venue request):</label>
              <input
                style={{ width: '100%', padding: '8px' }}
                type="datetime-local"
                name="date"
                value={eventForm.date}
                onChange={handleEventFormChange}
              />
            </div>
            <button
              style={{ padding: '10px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}
              type="submit"
            >
              Post Event
            </button>
          </form>
        </div>
      )}
      {activeTab === 'post' && approvedVenues.length === 0 && (
        <div style={{ padding: '20px', color: '#888' }}>
          No approved venues available. Please request and wait for venue approval.
        </div>
      )}      {/* My Events Tab */}
      {activeTab === 'events' && (
        <div>
          <h3>My Published Events</h3>
          {coordinatorEvents.length === 0 ? (
            <p>No events published yet. Request venue approval and post events.</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {coordinatorEvents.map(event => (
                <li key={event._id} style={{ padding: '15px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                  <h4>{event.title}</h4>
                  <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
                  <p><strong>Venue:</strong> {event.venue}</p>
                  
                  {/* Registration Status */}
                  <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                    {event.registrationClosed ? (
                      <span style={{ color: 'orange', fontWeight: 'bold' }}>
                        🔒 Registration Closed
                        {event.registrationClosedAt && (
                          <span style={{ fontSize: '0.9em', color: '#666', marginLeft: '10px' }}>
                            ({new Date(event.registrationClosedAt).toLocaleDateString()})
                          </span>
                        )}
                      </span>
                    ) : new Date() > new Date(event.date) ? (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>
                        ⏰ Event Date Passed - Registration Auto-Closed
                      </span>
                    ) : (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>
                        ✅ Registration Open
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {/* Close Registration Button */}
                    {!event.registrationClosed && !event.attendanceCompleted && new Date() <= new Date(event.date) && (
                      <button
                        onClick={() => handleCloseRegistration(event._id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#FF9800',
                          color: 'white',
                          border: 'none',
                          cursor: closingRegistrationEventId === event._id ? 'not-allowed' : 'pointer',
                          borderRadius: '4px'
                        }}
                        disabled={closingRegistrationEventId === event._id}
                      >
                        {closingRegistrationEventId === event._id ? 'Closing...' : '🔒 Close Registration'}
                      </button>
                    )}

                    {/* Take Attendance Button */}
                    <button
                      onClick={() => {
                        if (!event.attendanceCompleted) handleAttendance(event._id);
                      }}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#FF5722',
                        color: 'white',
                        border: 'none',
                        cursor: event.attendanceCompleted ? 'not-allowed' : 'pointer',
                        borderRadius: '4px'
                      }}
                      disabled={event.attendanceCompleted}
                    >
                      Take Attendance
                    </button>

                    {/* Submit & Generate Certificates Button */}
                    <button
                      onClick={() => handleSubmitAndGenerate(event._id)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        cursor: submittingEventId === event._id || event.attendanceCompleted ? 'not-allowed' : 'pointer',
                        borderRadius: '4px'
                      }}
                      disabled={submittingEventId === event._id || event.attendanceCompleted}
                    >
                      {submittingEventId === event._id ? 'Processing...' : 'Submit & Generate Certificates'}
                    </button>
                  </div>

                  {/* Attendance Status */}
                  {event.attendanceCompleted && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      color: 'green',
                      fontWeight: 'bold'
                    }}>
                      Attendance Completed & Certificates Generated ✓
                    </span>
                  )}
                  
                  {/* Display registered students for the event */}
                  {event.registrations && event.registrations.length > 0 && (
                    <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                      <strong>Registered Students ({event.registrations.length}):</strong>
                      <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                        {event.registrations.map(student => (
                          <li key={student._id} style={{ padding: '5px 0' }}>
                            {student.name} ({student.email})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificate && selectedStudent && selectedEventForCertificate && (
        <Certificate 
          student={selectedStudent}
          event={selectedEventForCertificate}
          onClose={() => setShowCertificate(false)}
        />
      )}
      {/* Attendance Modal */}
      {showAttendanceModal && attendanceEventId && (
        <AttendanceModal 
          eventId={attendanceEventId} 
          onClose={() => {
            setShowAttendanceModal(false);
            setAttendanceEventId(null);
            // Refresh events list to show updated attendance status
            fetchEvents();
          }}          // Prevent opening modal if attendanceCompleted
          disabled={coordinatorEvents.find(ev => ev._id === attendanceEventId)?.attendanceCompleted}
        />
      )}
    </div>
  );
};

export default CoordinatorDashboard;