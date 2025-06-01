const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'coordinator', 'admin'],
    default: 'student'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // For coordinators
  year: String,
  clubName: String,
  // Reference to Club model
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club'
  },
  // Legacy field - mapping to clubId for backward compatibility
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club'
  },
  // For students
  department: String,
  registeredEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  contactNumber: {
    type: String,
    trim: true
  },
  profilePic: {
    type: String // URL or path to profile picture
  }
}, { timestamps: true });

// Add a virtual getter to ensure we always have a club reference
userSchema.virtual('effectiveClubId').get(function() {
  return this.clubId || this.club;
});

// Add pre-save hook to ensure club association
userSchema.pre('save', async function(next) {
  try {
    // If this is a coordinator with clubName but no club reference
    if (this.role === 'coordinator' && this.clubName && !this.club) {
      const Club = mongoose.model('Club');
      let club = await Club.findOne({ name: this.clubName });
      
      if (club) {
        this.club = club._id;
        console.log(`Auto-linked coordinator to existing club: ${club.name}`);
      }
    }
    next();
  } catch (err) {
    console.error('Error in User pre-save hook:', err);
    next();
  }
});

// Add a pre-save middleware to ensure club references are consistent
userSchema.pre('save', function(next) {
  // If club is set but clubId is not, copy the value
  if (this.club && !this.clubId) {
    this.clubId = this.club;
  }
  
  // If clubId is set but club is not, copy the value
  if (this.clubId && !this.club) {
    this.club = this.clubId;
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);
