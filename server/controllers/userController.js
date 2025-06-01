const User = require('../models/User');
const { sendMail } = require('../utils/mailer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

exports.getCoordinatorRequests = async (req, res) => {
  try {
    console.log("Getting coordinator requests");
    const requests = await User.find({ role: 'coordinator', isVerified: false });
    console.log(`Found ${requests.length} requests`);
    res.json(requests);
  } catch (error) {
    console.error("Error fetching coordinator requests:", error);
    res.status(500).json({ message: 'Server error fetching coordinator requests' });
  }
};

exports.approveCoordinator = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Approving coordinator with ID: ${userId}`);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Link coordinator to club
    if (user.clubName) {
      // Check if the club exists
      const Club = mongoose.model('Club');
      let club = await Club.findOne({ name: user.clubName });
      
      if (!club) {
        // Create a new club if it doesn't exist
        club = new Club({
          name: user.clubName,
          description: `Club for ${user.clubName}`
        });
        await club.save();
        console.log(`Created new club for coordinator: ${club.name} (${club._id})`);
      }
      
      // Link user to the club
      user.club = club._id;
      console.log(`Linked coordinator ${userId} to club: ${club.name} (${club._id})`);
    }
    
    // Update user status
    user.isVerified = true;
    await user.save();
    
    // Try to send notification email but continue if it fails
    if (user.email) {
      try {
        // Fire and forget - don't await
        sendMail(
          user.email,
          'Coordinator Approved',
          `Your coordinator profile is verified. You can now login.`
        ).catch(e => console.log('Email sending failed but approval succeeded'));
      } catch (emailError) {
        console.log('Email notification failed but coordinator was approved');
      }
    }
    
    console.log(`Coordinator ${userId} approved successfully`);
    res.json({ message: 'Coordinator approved successfully' });
  } catch (error) {
    console.error("Error approving coordinator:", error);
    res.status(500).json({ message: 'Server error approving coordinator' });
  }
};

exports.rejectCoordinator = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Rejecting coordinator with ID: ${userId}`);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Store email before deletion
    const userEmail = user.email;
    const userName = user.name;
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    console.log(`User ${userId} deleted`);
    
    // Try to send notification email but continue if it fails
    if (userEmail) {
      try {
        // Fire and forget - don't await
        sendMail(
          userEmail,
          'Coordinator Request Rejected',
          `Dear ${userName},\n\nWe regret to inform you that your request to be a coordinator has been rejected.\n\nBest regards,\nAdmin Team`
        ).catch(e => console.log('Email sending failed but rejection succeeded'));
      } catch (emailError) {
        console.log('Email notification failed but coordinator was rejected');
      }
    }
    
    console.log(`Coordinator ${userId} rejected successfully`);
    res.json({ message: 'Coordinator rejected successfully' });
  } catch (error) {
    console.error("Error rejecting coordinator:", error);
    res.status(500).json({ message: 'Server error rejecting coordinator' });
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.getCertificates = async (req, res) => {
  try {
    // Import Certificate model
    const Certificate = require('../models/Certificate');

    // Find certificates for the authenticated user
    const certificates = await Certificate.find({
      user: req.user._id
    })
      .populate({
        path: 'event',
        select: 'title date venue club',
        populate: {
          path: 'club',
          select: 'name'
        }
      })
      .sort({ generatedAt: -1 });

    // Format certificates for response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      eventId: cert.event?._id,
      eventTitle: cert.event?.title || 'Event',
      date: cert.event?.date,
      venue: cert.event?.venue,
      clubName: cert.event?.club?.name || 'College Club',
      certificateId: cert._id,
      issueDate: cert.generatedAt,
      fileUrl: cert.fileUrl
    }));

    res.json(formattedCertificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Error retrieving certificates', error: error.message });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    // Find the user and populate their registered events
    const user = await User.findById(req.user._id).populate('registeredEvents');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.registeredEvents || user.registeredEvents.length === 0) {
      return res.json([]);
    }
    
    res.json(user.registeredEvents);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const user = req.user;
    // Save relative path or URL from multer
    user.profilePic = `/uploads/profile-pics/${req.file.filename}`;
    await user.save();
    res.json({ profilePicUrl: user.profilePic });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload profile picture' });
  }
};
