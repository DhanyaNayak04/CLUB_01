const VenueRequest = require('../models/VenueRequest');

/**
 * Maintains only the 5 most recent approved venue requests in the database
 * @returns {Promise<number>} Number of venue requests deleted
 */
const maintainVenueRequestLimit = async () => {
  try {
    // Find all approved venue requests, sorted by most recent
    const approvedRequests = await VenueRequest.find({ approved: true })
      .sort({ updatedAt: -1 });
    
    // If we have more than 5, delete the oldest ones
    if (approvedRequests.length > 5) {
      const requestsToDelete = approvedRequests.slice(5).map(req => req._id);
      
      const deleteResult = await VenueRequest.deleteMany({ 
        _id: { $in: requestsToDelete },
        approved: true 
      });
      
      console.log(`Venue cleanup: Deleted ${deleteResult.deletedCount} old approved venue requests. Maintaining 5-request limit.`);
      return deleteResult.deletedCount;
    }
    
    return 0;
  } catch (error) {
    console.error('Error during venue request cleanup:', error);
    return 0;
  }
};

/**
 * Gets the count of approved venue requests
 * @returns {Promise<number>} Number of approved venue requests
 */
const getApprovedVenueRequestCount = async () => {
  try {
    return await VenueRequest.countDocuments({ approved: true });
  } catch (error) {
    console.error('Error counting approved venue requests:', error);
    return 0;
  }
};

/**
 * Schedules periodic cleanup of venue requests
 * @param {number} intervalMinutes - Cleanup interval in minutes (default: 60)
 */
const scheduleVenueCleanup = (intervalMinutes = 60) => {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`Scheduling venue cleanup every ${intervalMinutes} minutes`);
  
  setInterval(async () => {
    console.log('Running scheduled venue request cleanup...');
    const deletedCount = await maintainVenueRequestLimit();
    if (deletedCount > 0) {
      console.log(`Scheduled cleanup completed: ${deletedCount} venue requests deleted.`);
    }
  }, intervalMs);
};

module.exports = {
  maintainVenueRequestLimit,
  getApprovedVenueRequestCount,
  scheduleVenueCleanup
};
