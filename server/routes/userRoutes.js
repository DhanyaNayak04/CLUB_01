// REMOVE THIS FILE or ensure it's not registered in server.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

// @route   POST api/users/upload-profile-pic
// @desc    Upload profile picture
// @access  Private
router.post('/upload-profile-pic', auth, upload.single('profilePic'), userController.uploadProfilePic);

module.exports = router;