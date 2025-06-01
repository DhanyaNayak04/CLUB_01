const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// GET /api/admin/venue-requests
router.get('/venue-requests', auth, adminController.getVenueRequests);

// POST /api/admin/approve-venue/:requestId
router.post('/approve-venue/:requestId', auth, adminController.approveVenueRequest);

// POST /api/admin/reject-venue/:requestId
router.post('/reject-venue/:requestId', auth, adminController.rejectVenueRequest);

module.exports = router;
