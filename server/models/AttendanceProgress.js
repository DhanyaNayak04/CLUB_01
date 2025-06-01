const mongoose = require('mongoose');

const AttendanceProgressSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    present: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one progress per event per coordinator
AttendanceProgressSchema.index({ eventId: 1, coordinatorId: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceProgress', AttendanceProgressSchema);
