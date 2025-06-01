const VenueRequest = require('../models/VenueRequest');
const User = require('../models/User');
const Club = require('../models/Club');
const mongoose = require('mongoose');

// Add a try-catch wrapper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

exports.getVenueRequests = asyncHandler(async (req, res) => {
  try {
    // Find all venue requests and populate coordinator details
    const requests = await VenueRequest.find()
      .populate('coordinator', 'name email clubName');
    
    // Format the response
    const formattedRequests = requests.map(req => ({
      _id: req._id,
      eventName: req.eventName || 'Unnamed Event',
      venue: req.venue || 'No Venue',
      eventDate: req.eventDate,
      timeFrom: req.timeFrom || '00:00',
      timeTo: req.timeTo || '00:00',
      eventDescription: req.description || '',
      approved: req.approved,
      clubName: req.coordinator?.clubName || 'Unknown Club',
      coordinatorName: req.coordinator?.name || 'Unknown',
      coordinatorEmail: req.coordinator?.email || ''
    }));
    
    res.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching venue requests:", error);
    res.status(500).json({ message: 'Failed to fetch venue requests' });
  }
});

exports.approveVenueRequest = asyncHandler(async (req, res) => {
  const request = await VenueRequest.findById(req.params.requestId)
    .populate('coordinator');
  
  if (!request) {
    return res.status(404).json({ message: 'Venue request not found' });
  }
  
  // Set approved status
  request.approved = true;
  await request.save();
  
  // Verify coordinator's club association
  if (request.coordinator && !request.coordinator.club && request.coordinator.clubName) {
    try {
      const Club = mongoose.model('Club');
      let club = await Club.findOne({ name: request.coordinator.clubName });
      
      if (!club) {
        // Create club if it doesn't exist
        club = new Club({
          name: request.coordinator.clubName,
          description: `Club for ${request.coordinator.clubName}`
        });
        await club.save();
      }
      
      // Update coordinator's club reference
      request.coordinator.club = club._id;
      await request.coordinator.save();
      console.log(`Updated coordinator's club association: ${club._id}`);
    } catch (err) {
      console.log('Error updating coordinator club association:', err);
    }
  }
  
  // Return success response
  res.json({ 
    message: 'Venue request approved successfully',
    requestId: request._id,
    approved: request.approved
  });
});

exports.rejectVenueRequest = asyncHandler(async (req, res) => {
  const request = await VenueRequest.findById(req.params.requestId);
  
  if (!request) {
    return res.status(404).json({ message: 'Venue request not found' });
  }
  
  // Delete the request
  await VenueRequest.findByIdAndDelete(req.params.requestId);
  
  res.json({ message: 'Venue request rejected and deleted' });
});
