const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');

console.log('Events router loaded');

// Public routes
router.get('/notifications', eventController.getNotifications);
router.get('/club/:clubId', eventController.getEventsByClub);
router.get('/recent', eventController.getRecentEvents); // Use new controller for recent events

// Protected routes
router.use(auth); // Apply auth middleware to all routes below

// Event management
router.post('/', eventController.createEvent);
router.get('/my', eventController.getMyEvents);
router.post('/request-venue', eventController.requestVenue);
router.get('/venue-requests', eventController.getMyVenueRequests);

// Registration routes
router.get('/:eventId/registration-status', eventController.getRegistrationStatus);
router.post('/:eventId/register', eventController.registerForEvent);
router.get('/:eventId/registrations', eventController.getEventRegistrations);

// Attendance routes
router.get('/:eventId/attendees', eventController.getEventAttendees);
router.post('/:eventId/attendance', eventController.markAttendance);
router.post('/:eventId/submit-attendance', eventController.submitAttendance);

module.exports = router;
