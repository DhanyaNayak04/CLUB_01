import React, { useState } from 'react';
import api from '../api';

function ClubForm({ onSuccess, club }) {
  const [formData, setFormData] = useState({
    name: club?.name || '',
    description: club?.description || '',
    department: club?.department || 'General'
  });
  const [logo, setLogo] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(club?.logoUrl || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Create form data to handle file upload
      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('description', formData.description);
      formPayload.append('department', formData.department);
      
      if (logo) {
        formPayload.append('logo', logo);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await api.post('/api/clubs', formPayload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        department: 'General'
      });
      setLogo(null);
      setPreviewLogo(null);
    } catch (err) {
      console.error('Error creating club:', err);
      setError(err.response?.data?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#fffbe7', borderRadius: '6px', border: '1px solid #af984c' }}>
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Club Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          required
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Department
        </label>
        <input
          type="text"
          name="department"
          value={formData.department}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '100px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Club Logo
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
        
        {previewLogo && (
          <div style={{ marginTop: '10px' }}>
            <p>Preview:</p>
            <img 
              src={previewLogo} 
              alt="Logo Preview" 
              style={{ maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd' }}
            />
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '12px 22px',
          background: loading ? '#cccccc' : 'linear-gradient(90deg, #af984c 0%, #000a28e6 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          boxShadow: '0 2px 8px 0 #af984c33'
        }}
      >
        {loading ? 'Creating...' : 'Create Club'}
      </button>
    </form>
  );
}

export default ClubForm;
