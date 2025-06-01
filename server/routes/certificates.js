const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const certificateController = require('../controllers/certificateController');

// POST /api/certificates/send
router.post('/send', async (req, res) => {
  const { email, certificatePath } = req.body;
  if (!email || !certificatePath) {
    return res.status(400).json({ error: 'Email and certificatePath are required' });
  }

  // Configure your SMTP transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // use env variable
      pass: process.env.EMAIL_PASS  // use env variable
    }
  });

  // Prepare mail options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Participation Certificate',
    text: 'Please find your certificate attached.',
    attachments: [
      {
        filename: path.basename(certificatePath),
        path: path.join(__dirname, '..', certificatePath)
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Certificate sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send certificate', details: error });
  }
});

// Generate certificate for a user and event
router.get('/generate/:userId/:eventId', certificateController.generateCertificate);

// Get all certificates for a user
router.get('/user/:userId', certificateController.getCertificates);

// Add a placeholder route for development
router.get('/placeholder.pdf', (req, res) => {
  res.send('This is a placeholder for a certificate PDF');
});

module.exports = router;
