const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL || true // Allow any origin in production for now
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Club Management API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Request logging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Database connection
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://dhanyanayak:Dhanya53@cluster0.imzofb9.mongodb.net/clubdb?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    
    // Initialize venue request cleanup scheduler
    const { scheduleVenueCleanup } = require('./utils/venueCleanup');
    scheduleVenueCleanup(60); // Run cleanup every 60 minutes
    
    // Load and register API routes
    const authRoutes = require('./routes/auth');
    const clubRoutes = require('./routes/clubs');
    const eventRoutes = require('./routes/events');
    const userRoutes = require('./routes/users');
    const attendanceRoutes = require('./routes/attendance');
    const adminRoutes = require('./routes/admin');
    const certificateRoutes = require('./routes/certificates');

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/clubs', clubRoutes);
    app.use('/api/events', eventRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/attendance', attendanceRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/certificates', certificateRoutes);

    // Handle undefined API routes
    app.use('/api/*', (req, res) => {
      res.status(404).json({ 
        success: false,
        message: `API endpoint not found: ${req.originalUrl}`,
        availableEndpoints: [
          '/api/auth', '/api/clubs', '/api/events', 
          '/api/users', '/api/attendance', '/api/admin', '/api/certificates'
        ]
      });
    });

    // Serve client in production
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../client/build')));
      
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
      });
    }

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('❌ Server Error:', err.stack);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });
