require('dotenv').config();
const express = require('express');
const app = express();
const usersRouter = require('./routes/users');
const certificatesRouter = require('./routes/certificates');
const attendanceRouter = require('./routes/attendance');

app.use('/uploads', express.static('uploads'));
app.use('/api/users', usersRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/attendance', attendanceRouter);

// Export the app itself, not a router
module.exports = app;

// Change this line (line 49) - either use the result variable or remove it
// Option 1: Remove the unused variable by not assigning it
await markAttendance(attendanceData);

// OR Option 2: Use the result
const result = await markAttendance(attendanceData);
console.log('Attendance marking result:', result);
// Or use it in some other way in your component
setSuccessMessage(`Attendance marked successfully: ${result.message || 'Success'}`);

// OR Option 3: If you just need to know if it succeeded
try {
  await markAttendance(attendanceData);
  // Success handling
} catch (error) {
  // Error handling
}