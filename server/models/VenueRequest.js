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

// Add compound index for cleanup operations (approved status + timestamp)
venueRequestSchema.index({ approved: 1, updatedAt: -1 });

// Pre-save middleware to enforce 5 approved venue request limit
venueRequestSchema.pre('save', async function(next) {
  // Only run cleanup when a venue request is being approved
  if (this.isModified('approved') && this.approved === true) {
    try {
      // Find all approved venue requests, sorted by most recent
      const approvedRequests = await this.constructor.find({ approved: true })
        .sort({ updatedAt: -1 });
      
      // If we already have 5 or more approved requests, delete the oldest ones
      if (approvedRequests.length >= 5) {
        const requestsToDelete = approvedRequests.slice(4).map(req => req._id);
        
        if (requestsToDelete.length > 0) {
          const deleteResult = await this.constructor.deleteMany({ 
            _id: { $in: requestsToDelete },
            approved: true 
          });
          
          console.log(`Pre-save cleanup: Deleted ${deleteResult.deletedCount} old approved venue requests to maintain 5-request limit.`);
        }
      }
    } catch (error) {
      console.error('Error during pre-save venue request cleanup:', error);
      // Don't fail the save operation if cleanup fails
    }
  }
  next();
});

module.exports = mongoose.model('VenueRequest', venueRequestSchema);
