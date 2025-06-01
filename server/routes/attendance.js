const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance'); // Add this import

/**
 * GET event attendees
 * Returns all attendees for a specific event
 */
router.get('/event/:eventId/attendees', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    return attendanceController.getEventAttendees(req, res);
  } catch (error) {
    console.error('Error fetching event attendees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendees',
      error: error.message
    });
  }
});

// Mark attendance for a student
router.post('/event/:eventId/student/:studentId', auth, attendanceController.markAttendance);

// Submit attendance for an event
router.post('/event/:eventId/submit', auth, attendanceController.submitAttendance);

// Additional route to ensure both formats work
router.post('/submit/:eventId', auth, attendanceController.submitAttendance);

// Save attendance progress for later completion
router.post('/event/:eventId/save', auth, attendanceController.saveAttendanceProgress);

// Get saved attendance data
router.get('/event/:eventId/saved', auth, attendanceController.getSavedAttendance);

module.exports = router;
