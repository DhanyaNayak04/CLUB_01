const auth = require('./auth');

/**
 * Middleware for role-based access control
 * @param {...string} allowed - Allowed roles
 * @returns {function} Express middleware function
 */
const roles = (...allowed) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('Role check failed: No user in request');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!allowed.includes(req.user.role)) {
      console.log(`Role check failed: User role ${req.user.role} not in allowed roles [${allowed.join(', ')}]`);
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    
    if (req.user.role === 'coordinator' && !req.user.isVerified) {
      console.log('Role check failed: Coordinator not verified');
      return res.status(403).json({ message: 'Your account is pending approval' });
    }
    
    next();
  };
};

module.exports = roles;
