require('dotenv').config();
const express = require('express');
const app = express();
const usersRouter = require('./routes/users');
const certificatesRouter = require('./routes/certificates');
const attendanceRouter = require('./routes/attendance');
const eventsRouter = require('./routes/events');

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api/users', usersRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/events', eventsRouter);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).send(`<h1>404 - Route not found: ${req.originalUrl}</h1>`);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Export the app itself, not a router
module.exports = app;