const nodemailer = require('nodemailer');
require('dotenv').config();

// Placeholder SMTP transport - swap in real credentials (Gmail app password,
// SendGrid, Mailtrap, etc.) via .env. In dev without valid SMTP creds this
// will log an error but will NOT crash the request flow (see catch in send()).
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

async function sendMail({ to, subject, text, html }) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@pmec.edu',
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    // Don't let email failures break the request lifecycle - just log it.
    console.error(`[mailer] Failed to send email to ${to}:`, err.message);
  }
}

module.exports = { sendMail };
