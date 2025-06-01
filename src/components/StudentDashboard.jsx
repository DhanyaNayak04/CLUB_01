import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
    const navigate = useNavigate();

    return (
        <div>
            <button onClick={() => navigate('/')}>Go to Home</button>
            {/* ...existing code... */}
        </div>
    );
};

export default StudentDashboard;