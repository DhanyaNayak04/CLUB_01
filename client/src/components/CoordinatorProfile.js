import React, { useState } from 'react';

const CoordinatorProfile = ({ coordinator }) => {
  const [profilePic, setProfilePic] = useState(coordinator.profilePic || null);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
        // TODO: Save the new profile picture to backend/server
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      <div className="profile-pic-section">
        <img
          src={profilePic || '/default-profile.png'}
          alt="Profile"
          className="profile-pic"
          style={{ width: 120, height: 120, borderRadius: '50%' }}
        />
        <input type="file" accept="image/*" onChange={handleProfilePicChange} />
      </div>
      <div className="profile-details">
        <p><strong>Name:</strong> {coordinator.name}</p>
        <p><strong>Contact Number:</strong> {coordinator.contactNumber}</p>
        <p><strong>Email:</strong> {coordinator.email}</p>
      </div>
    </div>
  );
};

export default CoordinatorProfile;
