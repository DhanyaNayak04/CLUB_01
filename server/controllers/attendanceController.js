const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const AttendanceProgress = require('../models/AttendanceProgress');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { sendMail } = require('../utils/mailer');

// Get all attendees for an event
exports.getEventAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;

    // First check if we have any saved attendance data
    const savedProgress = await AttendanceProgress.findOne({
      eventId,
      coordinatorId: req.user.id
    });    // Find the event and populate registered students
    const event = await Event.findById(eventId)
      .populate('registeredStudents', 'name email department studentId')
      .populate('participants', 'name email department studentId')
      .populate({
        path: 'registrations.userId',
        select: 'name email department studentId'
      });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Extract attendees from registeredStudents (primary), then fallback to participants and registrations
    let attendees = [];
    
    // First try registered students (this is where registrations are actually stored)
    if (event.registeredStudents && event.registeredStudents.length > 0) {
      attendees = event.registeredStudents.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        studentId: user.studentId,
        present: false // Default to not present
      }));
    }
    // Fallback to participants array
    else if (event.participants && event.participants.length > 0) {
      attendees = event.participants.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        studentId: user.studentId,
        present: false // Default to not present
      }));
    }
    // Final fallback to registrations array
    else if (event.registrations && event.registrations.length > 0) {
      attendees = event.registrations
        .filter(reg => reg.userId) // Filter out invalid registrations
        .map(reg => ({
          _id: reg.userId._id,
          name: reg.userId.name,
          email: reg.userId.email,
          department: reg.userId.department,
          studentId: reg.userId.studentId,
          present: false // Default to not present
        }));
    }

    // If we have saved progress, apply that to our attendees
    if (savedProgress && savedProgress.attendees.length > 0) {
      const savedStatus = {};
      savedProgress.attendees.forEach(att => {
        savedStatus[att.userId.toString()] = att.present;
      });

      attendees = attendees.map(att => ({
        ...att,
        present: savedStatus[att._id.toString()] || false
      }));
    }

    // Include event title in response
    res.json({
      attendees,
      event: {
        title: event.title,
        _id: event._id
      }
    });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark attendance for a specific student
exports.markAttendance = async (req, res) => {
  try {
    const { eventId, studentId } = req.params;
    const { present } = req.body;
    
    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Update or create attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { event: eventId, user: studentId },
      { present, markedBy: req.user.id },
      { new: true, upsert: true }
    );
    
    res.json(attendance);
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Close registration for an event
exports.closeRegistration = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user has permission to close registration
    if (event.coordinator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to close registration for this event' });
    }

    // Check if registration is already closed
    if (event.registrationClosed) {
      return res.status(400).json({ message: 'Registration is already closed for this event' });
    }

    // Close registration
    event.registrationClosed = true;
    event.registrationClosedAt = Date.now();
    event.registrationClosedBy = req.user.id;
    await event.save();

    res.json({
      message: 'Registration closed successfully',
      event: {
        _id: event._id,
        title: event.title,
        registrationClosed: event.registrationClosed,
        registrationClosedAt: event.registrationClosedAt
      }
    });
  } catch (error) {
    console.error('Error closing registration:', error);
    res.status(500).json({ message: 'Server error closing registration', error: error.message });
  }
};

// Submit attendance for the entire event
exports.submitAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendees } = req.body;

    // Validate attendees array
    if (!Array.isArray(attendees) || attendees.some(a => !a.userId || typeof a.present !== 'boolean')) {
      return res.status(400).json({ message: 'Invalid attendees data. Each attendee must have userId and present (boolean).' });
    }

    // Find the event
    const event = await Event.findById(eventId).populate('club', 'name');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Prevent re-submission
    if (event.attendanceCompleted) {
      return res.status(400).json({ message: 'Attendance has already been submitted for this event' });
    }

    // Check if user has permission to submit attendance
    if (event.coordinator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to submit attendance for this event' });
    }

    // Process each attendee
    const attendancePromises = attendees.map(async ({ userId, present }) => {
      // Use 'student' field for Attendance model, not 'user'
      await Attendance.findOneAndUpdate(
        { event: eventId, student: userId },
        { present, markedBy: req.user.id, submittedAt: Date.now() },
        { new: true, upsert: true }
      );

      // Generate certificate if present
      if (present) {
        let cert = await Certificate.findOne({ event: eventId, user: userId });
        if (!cert) {
          cert = new Certificate({
            event: eventId,
            user: userId,
            generatedBy: req.user.id,
            fileUrl: '' // Optionally set file URL if you generate a file
          });
          await cert.save();

          // Send certificate email
          try {
            const student = await User.findById(userId);
            if (student && student.email) {
              await sendMail(
                student.email,
                `Certificate for ${event.title}`,
                `Congratulations! Your certificate for participating in "${event.title}" organized by ${event.club?.name || 'the club'} is now available in your dashboard.`
              );
            }
          } catch (emailErr) {
            console.error('Failed to send certificate email:', emailErr);
          }
        }
      }
    });

    await Promise.all(attendancePromises);

    // Mark event attendance as submitted and close registration
    event.attendanceCompleted = true;
    event.attendanceSubmittedAt = Date.now();
    event.registrationClosed = true;
    event.registrationClosedAt = Date.now();
    event.registrationClosedBy = req.user.id;
    await event.save();

    // Remove any saved progress after submission
    await AttendanceProgress.findOneAndDelete({
      eventId,
      coordinatorId: req.user.id
    });

    res.json({
      message: 'Attendance submitted successfully and certificates generated.',
      event: event._id
    });
  } catch (error) {
    console.error('Error submitting attendance:', error, error.stack, req.body);
    res.status(500).json({ message: 'Server error submitting attendance', error: error.message });
  }
};

// Save attendance progress for later completion
exports.saveAttendanceProgress = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendees } = req.body;
    
    // Save the current attendance progress
    await AttendanceProgress.findOneAndUpdate(
      { 
        eventId,
        coordinatorId: req.user.id 
      },
      {
        eventId,
        coordinatorId: req.user.id,
        attendees,
        updatedAt: Date.now()
      },
      { new: true, upsert: true }
    );
    
    res.json({ message: 'Attendance progress saved' });
  } catch (error) {
    console.error('Error saving attendance progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get saved attendance data
exports.getSavedAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const savedProgress = await AttendanceProgress.findOne({
      eventId,
      coordinatorId: req.user.id
    });
    
    if (!savedProgress) {
      return res.json({ attendees: [] });
    }
    
    res.json({ attendees: savedProgress.attendees });
  } catch (error) {
    console.error('Error getting saved attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
