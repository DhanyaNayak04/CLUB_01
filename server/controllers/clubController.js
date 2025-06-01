const Club = require('../models/Club');
const User = require('../models/User');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all clubs
exports.getAllClubs = async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    res.json(clubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ message: 'Error fetching clubs' });
  }
};

// Get club by ID
exports.getClubById = async (req, res) => {
  try {
    const clubId = req.params.id;

    if (!clubId || clubId === 'undefined' || !mongoose.Types.ObjectId.isValid(clubId)) {
      console.log(`Invalid club ID: ${clubId}`);
      return res.status(400).json({ message: 'Invalid club ID' });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    res.json(club);
  } catch (error) {
    console.error('Error fetching club:', error);
    res.status(500).json({ message: 'Error fetching club' });
  }
};

// Create a new club
exports.createClub = async (req, res) => {
  try {
    const { name, description, department } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Club name is required' });
    }

    // Check if club already exists
    const existingClub = await Club.findOne({ name });
    if (existingClub) {
      return res.status(400).json({ message: 'A club with this name already exists' });
    }

    // Create club without logo first
    const club = new Club({
      name,
      description: description || '',
      department: department || 'General'
    });

    // Handle logo upload if present
    if (req.file) {
      console.log('Logo file received:', req.file.originalname);
      
      // Generate a unique filename to prevent collisions
      const fileName = `club_${Date.now()}${path.extname(req.file.originalname)}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write the file
      fs.writeFileSync(filePath, req.file.buffer);

      // Set the logo URL
      club.logoUrl = `/uploads/${fileName}`;
      console.log('Logo URL set:', club.logoUrl);
    } else {
      // Fix: Safely get first letter or use a default
      const clubName = String(name || ''); // Convert to string and handle null/undefined
      const firstLetter = clubName.length > 0 ? clubName.charAt(0).toUpperCase() : 'C';
      club.logoUrl = `https://via.placeholder.com/100?text=${encodeURIComponent(firstLetter)}`;
    }

    await club.save();
    
    console.log(`Club "${club.name}" created successfully with id: ${club._id}`);
    res.status(201).json({ message: 'Club created successfully', club });
  } catch (error) {
    console.error('Error creating club:', error);
    res.status(500).json({ message: 'Error creating club', error: error.message });
  }
};

// Update club
exports.updateClub = async (req, res) => {
  try {
    const { name, description } = req.body;
    const club = await Club.findById(req.params.clubId);

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    if (name) club.name = name;
    if (description) club.description = description;

    // Handle logo update if present
    if (req.file) {
      // Delete old logo if exists
      if (club.logoUrl) {
        const oldLogoPath = path.join(__dirname, '..', club.logoUrl);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      // Generate a unique filename
      const fileName = `club_${Date.now()}${path.extname(req.file.originalname)}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write new file
      fs.writeFileSync(filePath, req.file.buffer);

      // Update logo URL
      club.logoUrl = `/uploads/${fileName}`;
    }

    await club.save();
    res.json(club);
  } catch (error) {
    console.error('Error updating club:', error);
    res.status(500).json({ message: 'Error updating club' });
  }
};

// Delete club
exports.deleteClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Delete logo file if exists
    if (club.logoUrl) {
      const logoPath = path.join(__dirname, '..', club.logoUrl);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    await Club.findByIdAndDelete(req.params.clubId);
    res.json({ message: 'Club deleted successfully' });
  } catch (error) {
    console.error('Error deleting club:', error);
    res.status(500).json({ message: 'Error deleting club' });
  }
};

// Update club description (coordinator only)
exports.updateClubDescription = async (req, res) => {
  try {
    const { description } = req.body;
    console.log(`User ${req.user._id} attempting to update description for club: ${req.user.club}`);
    
    // Validate input
    if (!description || description.trim() === '') {
      return res.status(400).json({ message: 'Description is required and cannot be empty' });
    }

    // Find the coordinator's club
    if (!req.user.club) {
      console.log(`User has no club assignment: ${req.user._id}`);
      return res.status(400).json({ message: 'You are not assigned to any club' });
    }

    // Verify user is a coordinator
    if (req.user.role !== 'coordinator' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only coordinators or admins can update club descriptions' });
    }

    // Ensure club ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.user.club)) {
      console.log(`Invalid club ID format: ${req.user.club}`);
      return res.status(400).json({ message: 'Invalid club ID format' });
    }

    const club = await Club.findById(req.user.club);
    if (!club) {
      console.log(`Club not found: ${req.user.club}`);
      return res.status(404).json({ message: 'Club not found' });
    }

    // Update description
    club.description = description.trim();
    await club.save();
    console.log(`Updated description for club: ${club._id}`);

    // Return the entire club object
    res.json({ 
      message: 'Club description updated successfully', 
      club: {
        _id: club._id,
        name: club.name,
        description: club.description,
        department: club.department,
        logoUrl: club.logoUrl
      }
    });
  } catch (error) {
    console.error('Error updating club description:', error);
    res.status(500).json({ message: 'Server error updating club description', error: error.message });
  }
};
