const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const auth = require('../middleware/auth');
const multer = require('multer');

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Add error handling to multer middleware
const uploadWithErrorHandling = (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Public routes
router.get('/', clubController.getAllClubs);
// Add compatibility route for /clubs/:id (no /api prefix)
router.get('/:id', clubController.getClubById);

// Admin routes - protected
router.post('/', auth, uploadWithErrorHandling, clubController.createClub);
router.put('/:clubId', auth, uploadWithErrorHandling, clubController.updateClub);
router.delete('/:clubId', auth, clubController.deleteClub);

// Update description route - accessible by coordinators
// The path below is the correct one that matches client requests
router.put('/update-description', auth, clubController.updateClubDescription);

module.exports = router;
