const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Update with your three specific admin emails
const ADMIN_EMAILS = [
  'dhanya.is22@bmsce.ac.in',
  'disha.is22@bmsce.ac.in',
  'saladi.is22@bmsce.ac.in'
];

// Fallback secret in case environment variable is not set
const JWT_SECRET = process.env.JWT_SECRET || 'Dhanya53@';

exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const user = await User.findOne({ email, role });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    if (role === 'admin' && !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    
    if (!user.isVerified && role !== 'admin' && role !== 'student') {
      return res.status(403).json({ message: 'Profile not verified yet' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Include role in the JWT payload for better authorization
    const token = jwt.sign({ 
      userId: user._id, // Keep using userId in the token
      role: user.role
    }, JWT_SECRET, { expiresIn: '1d' });
    
    console.log('Login successful for:', email);
    res.json({ token, role: user.role }); // Revert to original response format
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, year, clubName, department } = req.body;
    
    // Check if admin email is authorized
    if (role === 'admin' && !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      name, 
      email, 
      password: hashed, 
      role, 
      year, 
      clubName,
      department,
      isVerified: role === 'admin' || role === 'student'
    });
    
    await user.save();
    console.log('New user registered:', email, 'as', role);
    
    res.json({ message: 'Signup successful. Awaiting approval if coordinator.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};
