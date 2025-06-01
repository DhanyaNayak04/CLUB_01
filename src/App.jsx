import React from 'react';
import { Routes, Route } from 'react-router-dom';
// Remove or comment out the ClubPage import
// import ClubPage from './components/ClubPage';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* ...existing code... */}
        {/* Remove or comment out the ClubPage route */}
        {/* <Route path="/club" element={<ClubPage />} /> */}
        {/* ...existing code... */}
      </Routes>
    </div>
  );
}

export default App;