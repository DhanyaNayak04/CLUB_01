const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pics/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Fix: Apply auth middleware before roles middleware
router.get('/coordinator-requests', auth, roles('admin'), userController.getCoordinatorRequests);
router.post('/approve-coordinator/:userId', auth, roles('admin'), userController.approveCoordinator);
router.post('/reject-coordinator/:userId', auth, roles('admin'), userController.rejectCoordinator);
router.get('/me', auth, userController.getMe);
router.get('/certificates', auth, userController.getCertificates);

// Add the missing endpoint for participated events
router.get('/my-events', auth, userController.getMyEvents);

// POST /api/users/upload-profile-pic
router.post(
  '/upload-profile-pic',
  auth,
  upload.single('profilePic'),
  userController.uploadProfilePic
);

module.exports = router;
