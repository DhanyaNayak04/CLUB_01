const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  venueApproved: {
    type: Boolean,
    default: true
  },
  isVenueRequest: {
    type: Boolean,
    default: false
  },
  venueRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VenueRequest'
  },
  timeFrom: String,
  timeTo: String,
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  registrations: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    attended: {
      type: Boolean,
      default: false
    }
  }],
  attendanceCompleted: {
    type: Boolean,
    default: false
  },
  attendanceSubmittedAt: {
    type: Date
  },
  registrationDeadline: {
    type: Date,
    required: false // Optional, but recommended to set
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for participant count
eventSchema.virtual('participantCount').get(function() {
  return this.participants ? this.participants.length : 0;
});

module.exports = mongoose.model('Event', eventSchema);
