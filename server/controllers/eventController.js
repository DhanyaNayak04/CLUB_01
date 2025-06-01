const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');
const VenueRequest = require('../models/VenueRequest');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');

exports.getNotifications = async (req, res) => {
  try {
    // Get only actual events (not venue requests) for notifications
    const events = await Event.find({
      isVenueRequest: false,  // Only actual events, not venue requests
      venueApproved: true     // Only approved events
    })
    .populate('club', 'name') // Include club name
    .sort({ createdAt: -1 })
    .limit(10);
    
    // Format for notification bar
    const formattedEvents = events.map(e => ({
      _id: e._id,
      title: e.title,
      clubId: e.club?._id || e.club,
      clubName: e.club?.name || 'Club Event',
      date: e.date
    }));
    
    res.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching events notifications' });
  }
};

exports.getEventsByClub = async (req, res) => {
  try {
    // Check if clubId is valid
    const clubId = req.params.clubId;
    
    if (!clubId || clubId === 'undefined') {
      console.log(`Invalid club ID: ${clubId}`);
      return res.status(400).json({ message: 'Invalid club ID', events: [] });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(clubId)) {
      console.log(`Invalid ObjectId format for club ID: ${clubId}`);
      return res.status(400).json({ message: 'Invalid club ID format', events: [] });
    }
    
    console.log(`Fetching events for club: ${clubId}`);
    
    // Get only actual events for a specific club
    const events = await Event.find({ 
      club: clubId,
      isVenueRequest: false // Only actual events, not venue requests
    }).sort({ date: 1 }); // Sort by date ascending (upcoming first)
    
    console.log(`Found ${events.length} events for club ${clubId}`);
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching club events:', error);
    res.status(500).json({ message: 'Error fetching events', events: [] });
  }
};

// Check registration status for an event
exports.getRegistrationStatus = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user._id;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is in participants array
    const isRegistered = event.participants && 
      event.participants.some(id => id.toString() === userId.toString());
    
    res.json({ isRegistered });
  } catch (error) {
    console.error('Error checking registration status:', error);
    res.status(500).json({ message: 'Server error checking registration status' });
  }
};

// Register for an event
exports.registerForEvent = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can register for events' });
    }
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    // Prevent registration after deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline has passed for this event' });
    }
    if (!event.participants) event.participants = [];
    if (event.participants.some(id => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    event.participants.push(req.user._id);
    if (!event.registrations) event.registrations = [];
    if (!event.registrations.some(r => r.userId.toString() === req.user._id.toString())) {
      event.registrations.push({ userId: req.user._id, attended: false });
    }
    await event.save();
    try {
      const user = await User.findById(req.user._id);
      if (user) {
        if (!user.registeredEvents) user.registeredEvents = [];
        if (!user.registeredEvents.includes(eventId)) {
          user.registeredEvents.push(eventId);
          await user.save();
        }
      }
    } catch (userUpdateError) {
      console.error('Error updating user registeredEvents:', userUpdateError);
    }
    res.json({ message: 'Successfully registered for the event' });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Server error registering for event' });
  }
};

exports.getEventAttendees = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    if (req.user.role !== 'coordinator' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view attendees' });
    }
    const event = await Event.findById(eventId)
      .populate('participants', 'name email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (req.user.role === 'coordinator' &&
        event.coordinator.toString() !== req.user._id.toString() &&
        (!req.user.club || event.club.toString() !== req.user.club.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this event\'s attendees' });
    }
    const attendees = event.participants ? event.participants.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      registeredAt: new Date()
    })) : [];
    res.json(attendees);
  } catch (error) {
    console.error('Error fetching event attendees:', error);
    res.status(500).json({ message: 'Server error fetching attendees' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    console.log('Create event request received:', req.body);
    if (req.user.role !== 'coordinator') {
      console.log('Error: Only coordinators can create events');
      return res.status(403).json({ message: 'Only coordinators can create events' });
    }
    if (!req.user.isVerified) {
      console.log('Error: Coordinator not verified');
      return res.status(403).json({ message: 'Your account needs admin approval before posting events' });
    }
    const { title, description, date, venueRequestId, registrationDeadline } = req.body;
    if (!title || !description || !venueRequestId) {
      console.log('Missing required fields:', { title, description, venueRequestId });
      return res.status(400).json({ message: 'Title, description and venue request ID are required' });
    }
    const venueRequest = await VenueRequest.findById(venueRequestId);
    if (!venueRequest) {
      console.log('Venue request not found:', venueRequestId);
      return res.status(404).json({ message: 'Venue request not found' });
    }
    if (!venueRequest.approved) {
      console.log('Venue request not approved:', venueRequestId);
      return res.status(400).json({ message: 'Venue request has not been approved yet' });
    }
    const existingEvent = await Event.findOne({ venueRequestId: venueRequestId });
    if (existingEvent) {
      console.log('Event already created for this venue request:', venueRequestId);
      return res.status(400).json({ message: 'An event has already been created for this venue request' });
    }
    const venueDetails = {
      venue: venueRequest.venue,
      date: date ? new Date(date) : new Date(venueRequest.eventDate)
    };
    let clubId = null;
    if (req.user.club) {
      clubId = req.user.club;
    } else {
      const Club = mongoose.model('Club');
      const club = await Club.findOne({ name: req.user.clubName });
      if (club) {
        clubId = club._id;
        req.user.club = clubId;
        await req.user.save();
      }
    }
    if (!clubId) {
      console.log('No club found for coordinator:', req.user._id, req.user.clubName);
      return res.status(400).json({ message: 'No club found for this coordinator' });
    }
    const event = new Event({
      title,
      description,
      date: venueDetails.date,
      venue: venueDetails.venue,
      club: clubId,
      coordinator: req.user._id,
      venueApproved: true,
      isVenueRequest: false,
      venueRequestId: venueRequestId,
      participants: [],
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined
    });
    console.log('Attempting to save event:', {
      title: event.title,
      club: event.club,
      date: event.date,
      venue: event.venue
    });
    await event.save();
    console.log('Event created successfully with ID:', event._id);
    res.status(201).json({
      message: 'Event created successfully',
      event: {
        _id: event._id,
        title: event.title,
        description: event.description,
        date: event.date,
        venue: event.venue,
        club: event.club
      }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: `Server error creating event: ${error.message}` });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      coordinator: req.user._id,
      isVenueRequest: false
    });
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error retrieving events' });
  }
};

exports.requestVenue = async (req, res) => {
  try {
    const { venue, eventName, eventDate, timeFrom, timeTo, eventDescription } = req.body;
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!venue || !eventName || !eventDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    console.log('Creating venue request:', { eventName, venue, date: eventDate });
    const venueRequest = new VenueRequest({
      eventName,
      venue,
      eventDate: new Date(eventDate),
      timeFrom: timeFrom || '09:00',
      timeTo: timeTo || '17:00',
      description: eventDescription,
      coordinator: req.user._id,
      approved: false
    });
    await venueRequest.save();
    console.log('Venue request created with ID:', venueRequest._id);
    res.status(201).json({
      message: 'Venue request submitted successfully',
      requestId: venueRequest._id
    });
  } catch (error) {
    console.error('Error creating venue request:', error);
    res.status(500).json({ message: 'Server error during venue request' });
  }
};

exports.getMyVenueRequests = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    console.log('Getting venue requests for coordinator:', req.user._id);
    const requests = await VenueRequest.find({ coordinator: req.user._id })
      .sort({ createdAt: -1 });
    console.log(`Found ${requests.length} venue requests`);
    res.json(requests);
  } catch (error) {
    console.error('Error retrieving venue requests:', error);
    res.status(500).json({ message: 'Server error retrieving venue requests' });
  }
};

exports.getEventRegistrations = async (req, res) => {
  console.log('getEventRegistrations called for eventId:', req.params.eventId);
  try {
    const eventId = req.params.eventId;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (req.user.role === 'coordinator') {
      const userClubId = req.user.club ? req.user.club.toString() : null;
      const eventClubId = event.club ? event.club.toString() : null;
      const isEventOwner = event.coordinator?.toString() === req.user._id.toString();
      if (!isEventOwner && userClubId !== eventClubId) {
        console.log('Authorization failed: coordinator not authorized for this event');
        console.log('User club:', userClubId, 'Event club:', eventClubId);
        return res.status(403).json({ message: 'Not authorized to view this event\'s registrations' });
      }
    }
    const participants = await User.find({
      _id: { $in: event.participants }
    }).select('_id name email department');
    res.json(participants || []);
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    res.status(500).json({ message: 'Server error fetching event registrations' });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { studentId, present } = req.body;
    if (present === undefined || !studentId) {
      return res.status(400).json({ message: 'Attendance status and student ID are required' });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    // Prevent attendance before event date
    const now = new Date();
    if (event.date && now < event.date) {
      return res.status(400).json({ message: 'Attendance can only be taken on or after the event date' });
    }
    if (event.attendanceCompleted) {
      return res.status(400).json({ message: 'Attendance has already been submitted for this event' });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'Not authorized to mark attendance' });
    }
    if (!event.registrations) event.registrations = [];
    let registration = event.registrations.find(
      reg => reg.userId && reg.userId.toString() === studentId
    );
    if (!registration) {
      const isParticipant = event.participants.some(
        id => id.toString() === studentId
      );
      if (!isParticipant) {
        return res.status(404).json({ message: 'Student is not a participant of this event' });
      }
      registration = { userId: studentId, attended: present };
      event.registrations.push(registration);
    } else {
      registration.attended = present;
    }
    await event.save();
    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error marking attendance' });
  }
};

exports.submitAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendees } = req.body;
    if (!attendees || !Array.isArray(attendees)) {
      return res.status(400).json({ message: 'Invalid attendees data' });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.attendanceCompleted) {
      return res.status(400).json({ message: 'Attendance has already been submitted for this event' });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'Not authorized to submit attendance' });
    }
    let certificatesGenerated = 0;
    let clubName = '';
    if (event.club) {
      const club = await mongoose.model('Club').findById(event.club);
      clubName = club ? club.name : '';
    }
    for (const attendee of attendees) {
      const { userId, present } = attendee;
      const registration = event.registrations.find(
        reg => reg.userId && reg.userId.toString() === userId
      );
      if (registration) {
        registration.attended = present;
        if (present) {
          certificatesGenerated++;
          // Use correct Certificate schema fields
          let cert = await Certificate.findOne({ event: eventId, user: userId });
          if (!cert) {
            cert = new Certificate({
              event: eventId,
              user: userId,
              generatedBy: req.user._id
            });
            await cert.save();
          }
          // Email sending logic can remain as is or be improved
        }
      }
    }
    event.attendanceCompleted = true;
    await event.save();
    res.json({
      message: 'Attendance submitted successfully',
      certificatesGenerated
    });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({ message: 'Error submitting attendance' });
  }
};

// Add this function for /api/events/recent
exports.getRecentEvents = async (req, res) => {
  try {
    // Get latest 10 approved, non-venue-request events (not just notifications)
    const events = await Event.find({
      isVenueRequest: false,
      venueApproved: true
    })
    .populate('club', 'name')
    .sort({ date: -1 }) // Most recent events first
    .limit(10);

    res.json(events);
  } catch (error) {
    console.error('Error fetching recent events:', error);
    res.status(500).json({ message: 'Error fetching recent events' });
  }
};
