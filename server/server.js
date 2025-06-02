const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// CORS configuration - TEMPORARY for testing
const corsOptions = {
  origin: true, // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from certificates directory
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

// Add debug endpoint
app.get('/', (req, res) => {
  res.send(`<h1>Club Management API</h1><p>Server is running. API endpoints are available at /api/*</p>`);
});

// Add a test endpoint at base URL
app.get('/test', (req, res) => {
  res.json({ message: 'Server is responding to requests' });
});

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Configure MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4 // Force IPv4
};

// Connect to MongoDB with proper error handling
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://dhanyanayak:Dhanya53@cluster0.imzofb9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', mongooseOptions)
  .then(() => {
    console.log('MongoDB connected successfully');
    
    // Only start the server after successful DB connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit with error
  });

// Add a simple ping endpoint for testing API connectivity
app.get('/api/ping', (req, res) => {
  res.json({ message: 'API server is running' });
});

// Load routes
const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const eventsRouter = require('./routes/events');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const certificatesRouter = require('./routes/certificates');  // Added certificates router

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventsRouter);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', certificatesRouter);  // Added certificates route

// Handle missing API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API endpoint not found: ${req.originalUrl}` });
});

// Serve static files from client build folder in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle any requests that don't match the ones above
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Modify the catch-all middleware to only run if no other route has matched
// This should be the LAST middleware
app.use((req, res) => {
  res.status(404).send(`<h1>404 - Route not found: ${req.originalUrl}</h1>`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ 
    message: 'Server error occurred',
    error: process.env.NODE_ENV === 'production' ? 'An internal error occurred' : err.message
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Give the server a chance to gracefully exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Export app for testing purposes
module.exports = app;
