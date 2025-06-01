const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Verify admin status middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Access denied - Admin only' });
};

// Apply auth middleware to each route
router.get('/venue-requests', auth, isAdmin, adminController.getVenueRequests);
router.post('/approve-venue/:requestId', auth, isAdmin, adminController.approveVenueRequest);
router.post('/reject-venue/:requestId', auth, isAdmin, adminController.rejectVenueRequest);

module.exports = router;
