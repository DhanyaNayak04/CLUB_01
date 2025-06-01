const mongoose = require('mongoose');

const venueRequestSchema = new mongoose.Schema({
  eventName: { 
    type: String, 
    required: true,
    trim: true
  },
  venue: { 
    type: String, 
    required: true,
    trim: true
  },
  eventDate: { 
    type: Date, 
    required: true 
  },
  timeFrom: { 
    type: String, 
    default: '09:00',
    trim: true
  },
  timeTo: { 
    type: String, 
    default: '17:00',
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  coordinator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  approved: { 
    type: Boolean, 
    default: false
  }
}, { 
  timestamps: true 
});

// Add index for better performance
venueRequestSchema.index({ coordinator: 1, approved: 1 });

module.exports = mongoose.model('VenueRequest', venueRequestSchema);
