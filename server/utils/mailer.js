const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.ethereal.email',
  port: process.env.MAIL_PORT || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
   user: process.env.MAIL_USER || process.env.EMAIL_USER,
    pass: process.env.MAIL_PASS || process.env.EMAIL_PASS
  }
});

// For development, if no SMTP configured, use fake test account
async function createTestAccount() {
  // If email credentials are provided, no need for test account
  if (process.env.MAIL_USER && process.env.MAIL_PASS) return;
  
  try {
    // Create test account for development
    const testAccount = await nodemailer.createTestAccount();
    console.log('Created test email account:', testAccount.user);
    
    // Configure transporter with test account
    transporter.host = 'smtp.ethereal.email';
    transporter.port = 587;
    transporter.secure = false;
    transporter.auth = {
      user: testAccount.user,
      pass: testAccount.pass
    };
  } catch (err) {
    console.error('Failed to create test email account:', err);
  }
}

// Initialize test account if needed
createTestAccount();

// Send email function
exports.sendMail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || '"Club Management System" <no-reply@clubsystem.com>',
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>')
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Log URL to preview email in development (if using ethereal)
    if (transporter.host === 'smtp.ethereal.email') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
