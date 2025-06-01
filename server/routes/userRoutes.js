// REMOVE THIS FILE or ensure it's not registered in server.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pics/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, userController.getMe);

// @route   GET api/users/coordinator-requests
// @desc    Get coordinator requests
// @access  Private
router.get('/coordinator-requests', auth, userController.getCoordinatorRequests);

// @route   POST api/users/approve-coordinator/:userId
// @desc    Approve coordinator
// @access  Private
router.post('/approve-coordinator/:userId', auth, userController.approveCoordinator);

// @route   POST api/users/reject-coordinator/:userId
// @desc    Reject coordinator
// @access  Private
router.post('/reject-coordinator/:userId', auth, userController.rejectCoordinator);

// @route   GET api/users/certificates
// @desc    Get user certificates
// @access  Private
router.get('/certificates', auth, userController.getCertificates);

// @route   GET api/users/my-events
// @desc    Get user events
// @access  Private
router.get('/my-events', auth, userController.getMyEvents);

// @route   POST api/users/upload-profile-pic
// @desc    Upload profile picture
// @access  Private
router.post('/upload-profile-pic', auth, upload.single('profilePic'), userController.uploadProfilePic);

module.exports = router;