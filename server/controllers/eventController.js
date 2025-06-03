const Event = require('../models/Event');
const VenueRequest = require('../models/VenueRequest');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// Get notifications/recent events
exports.getNotifications = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('coordinator', 'name')
      .populate('club', 'name')
      .sort({ date: -1 })
      .limit(5);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get events by club
exports.getEventsByClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const events = await Event.find({ club: clubId })
      .populate('coordinator', 'name')
      .sort({ date: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get recent events
exports.getRecentEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('coordinator', 'name')
      .populate('club', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, venueRequestId } = req.body;
    const userId = req.user.id;

    if (!venueRequestId) {
      return res.status(400).json({ message: 'Venue request ID is required' });
    }

    // Find the venue request
    const venueRequest = await VenueRequest.findById(venueRequestId);    if (!venueRequest) {
      return res.status(404).json({ message: 'Venue request not found' });
    }
    
    if (!venueRequest.approved) {
      return res.status(400).json({ message: 'Venue request must be approved first' });
    }

    // Get user's club association
    const user = await User.findById(userId).populate('club');
    if (!user.club) {
      return res.status(400).json({ message: 'User must be associated with a club to create events' });
    }
    
    // Create event data
    const eventData = {
      title,
      description,
      date: date || venueRequest.eventDate,
      venue: venueRequest.venue,
      venueRequest: venueRequestId,
      venueRequestId: venueRequestId, // Add this for compatibility
      coordinator: userId,
      club: user.club._id // Add club association
    };

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get my events (coordinator's events)
exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting events for coordinator:', userId);
      const events = await Event.find({ coordinator: userId })
      .populate('venueRequestId', 'eventName venue eventDate timeFrom timeTo approved')
      .populate('club', 'name')
      .populate('coordinator', 'name')
      .sort({ date: -1 });
    
    console.log('Found', events.length, 'events for coordinator');
    res.json(events);
  } catch (error) {
    console.error('Error in getMyEvents:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Request venue
exports.requestVenue = async (req, res) => {
  try {
    const { venue, eventName, eventDate, timeFrom, timeTo, eventDescription } = req.body;
    const userId = req.user.id || req.user._id;

    console.log('Request venue - User ID:', userId);
    console.log('Request venue - User object:', req.user);
    console.log('Request venue - Request body:', req.body);

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const venueRequest = new VenueRequest({
      venue,
      eventName,
      eventDate,
      timeFrom,
      timeTo,
      description: eventDescription,
      coordinator: userId
    });

    await venueRequest.save();
    res.status(201).json({ message: 'Venue request submitted successfully', venueRequest });
  } catch (error) {
    console.error('Request venue error details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get my venue requests
exports.getMyVenueRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting venue requests for coordinator:', userId);
    
    const venueRequests = await VenueRequest.find({ coordinator: userId })
      .sort({ createdAt: -1 });
    
    console.log('Found', venueRequests.length, 'venue requests');
    res.json(venueRequests);
  } catch (error) {
    console.error('Error fetching venue requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get registration status for an event
exports.getRegistrationStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const registration = await Event.findOne({
      _id: eventId,
      registeredStudents: userId
    });

    res.json({ isRegistered: !!registration });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register for event
exports.registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.registrationClosed) {
      return res.status(400).json({ message: 'Registration is closed for this event' });
    }

    // Check if already registered
    if (event.registeredStudents.includes(userId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    event.registeredStudents.push(userId);
    await event.save();

    res.json({ message: 'Successfully registered for event' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get event registrations
exports.getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId)
      .populate('registeredStudents', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event.registeredStudents || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get event attendees
exports.getEventAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId)
      .populate('registeredStudents', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({ event: eventId });
    const attendanceMap = attendanceRecords.reduce((map, record) => {
      map[record.student.toString()] = record.present;
      return map;
    }, {});

    const attendees = event.registeredStudents.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      present: attendanceMap[student._id.toString()] || false
    }));

    res.json({ attendees });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendees } = req.body;

    // Update or create attendance records
    for (const attendee of attendees) {
      await Attendance.findOneAndUpdate(
        { event: eventId, student: attendee.userId },
        { present: attendee.present },
        { upsert: true }
      );
    }

    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit attendance and generate certificates
exports.submitAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendees } = req.body;

    // Mark attendance
    for (const attendee of attendees) {
      await Attendance.findOneAndUpdate(
        { event: eventId, student: attendee.userId },
        { present: attendee.present },
        { upsert: true }
      );
    }

    // Mark event as attendance completed
    await Event.findByIdAndUpdate(eventId, { 
      attendanceCompleted: true 
    });

    res.json({ message: 'Attendance submitted and certificates generated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
