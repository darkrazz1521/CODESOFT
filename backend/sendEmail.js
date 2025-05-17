// sendEmail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,       // Your Gmail address from .env
    pass: process.env.GMAIL_APP_PASSWORD // Your Gmail app password from .env
  },
});

async function sendOTPEmail(toEmail, otp) {
  const mailOptions = {
    from: `"Devyntra OTP" <${process.env.GMAIL_EMAIL}>`,
    to: toEmail,
    subject: 'Your Devyntra OTP Code',
    text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendOTPEmail;
