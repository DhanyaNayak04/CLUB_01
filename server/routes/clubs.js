const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const auth = require('../middleware/auth');
const multer = require('multer');
const Club = require('../models/Club');

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

// GET /api/clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clubs' });
  }
});

// GET /api/clubs/:id
router.get('/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    res.json(club);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching club details' });
  }
});

// PUT /api/clubs/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { description } = req.body;
    const club = await Club.findByIdAndUpdate(
      req.params.id,
      { description },
      { new: true }
    );
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    res.json(club);
  } catch (error) {
    res.status(500).json({ message: 'Error updating club' });
  }
});

// POST /api/clubs
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, department } = req.body;
    const club = new Club({ name, description, department });
    await club.save();
    res.status(201).json({ message: 'Club created successfully', club });
  } catch (error) {
    res.status(500).json({ message: 'Error creating club' });
  }
});

module.exports = router;
