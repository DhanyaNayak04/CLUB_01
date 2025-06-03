const Club = require('../models/Club');

// Get club by ID
exports.getClubById = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    res.json(club);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update club description
exports.updateDescription = async (req, res) => {
  try {
    const { description } = req.body;
    const clubId = req.params.id;
    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }
    const club = await Club.findByIdAndUpdate(
      clubId,
      { description },
      { new: true }
    );
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    res.json({ message: 'Club description updated', club });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all clubs
exports.getAllClubs = async (req, res) => {
  try {
    const clubs = await Club.find();
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create club
exports.createClub = async (req, res) => {
  try {
    const { name, description, department } = req.body;
    
    if (!name || !department) {
      return res.status(400).json({ message: 'Name and department are required' });
    }

    const clubData = {
      name,
      description: description || '',
      department
    };

    // Handle logo upload if provided
    if (req.file) {
      // You can implement file upload logic here
      // For now, just storing the filename
      clubData.logo = req.file.filename;
    }

    const club = new Club(clubData);
    await club.save();
    
    res.status(201).json({ message: 'Club created successfully', club });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update club
exports.updateClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { name, description, department } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (department) updateData.department = department;

    // Handle logo upload if provided
    if (req.file) {
      updateData.logo = req.file.filename;
    }

    const club = await Club.findByIdAndUpdate(
      clubId,
      updateData,
      { new: true }
    );

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.json({ message: 'Club updated successfully', club });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete club
exports.deleteClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    
    const club = await Club.findByIdAndDelete(clubId);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.json({ message: 'Club deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update club description (specific route for coordinators)
exports.updateClubDescription = async (req, res) => {
  try {
    const { description } = req.body;
    const userId = req.user.id;
    
    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }

    // Find the user to get their club
    const User = require('../models/User');
    const user = await User.findById(userId).populate('club');
    
    if (!user || !user.club) {
      return res.status(404).json({ message: 'No club associated with your account' });
    }

    const club = await Club.findByIdAndUpdate(
      user.club._id,
      { description },
      { new: true }
    );

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.json({ message: 'Club description updated successfully', club });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
