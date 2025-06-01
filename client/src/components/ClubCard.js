import React from 'react';
import { useNavigate } from 'react-router-dom';

function ClubCard({ club }) {
  const navigate = useNavigate();
  const [logoError, setLogoError] = React.useState(false);
  
  // Club initial for fallback logo
  const clubInitial = club.name ? club.name.charAt(0).toUpperCase() : 'C';
  
  return (
    <div 
      className="club-card"
      onClick={() => navigate(`/club/${club._id}`)}
    >
      {/* Logo with fallback */}
      <div className="club-card-logo">
        {!logoError && club.logoUrl ? (
          <img 
            src={`${process.env.REACT_APP_API_URL || ''}${club.logoUrl}`} 
            alt={club.name}
            onError={() => setLogoError(true)} 
          />
        ) : (
          <div className="club-card-logo-fallback">
            {clubInitial}
          </div>
        )}
      </div>
      
      <div className="club-card-content">
        {/* Club name */}
        <h3 className="club-card-title">
          {club.name}
        </h3>
        
        {/* Club description */}
        <div className="club-card-description">
          <p>{club.description || 'No description available.'}</p>
        </div>
        
        {/* View button */}
        <button 
          className="club-card-button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/club/${club._id}`);
          }}
        >
          View Club
        </button>
      </div>
    </div>
  );
}

export default ClubCard;
