const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { createCaptcha, verifyCaptcha } = require('../utils/captcha');
const { sendMail } = require('../utils/mailer');
const { sendSMS } = require('../utils/sms');

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      office_role: user.office_role || user.role,
    },
    process.env.JWT_SECRET || 'pmec_jwt_secret_dev_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// -------- Captcha --------
function getCaptcha(req, res) {
  const { captchaId, svgUrl } = createCaptcha();
  res.json({ captchaId, svgUrl });
}

// -------- Student --------
async function registerStudent(req, res) {
  try {
    const { roll_no, name, department, semester, email, phone, password } = req.body;
    if (!roll_no || !name || !department || !semester || !email || !password) {
      return res.status(400).json({ error: 'College Registration Number, name, department, semester, email and password are required.' });
    }

    const existingEmail = await Student.findByEmail(email);
    if (existingEmail) return res.status(409).json({ error: 'An account with this email already exists.' });

    const password_hash = await bcrypt.hash(password, 10);
    const status = 'pending_otp';

    const student = await Student.create({
      roll_no,
      name,
      department,
      semester,
      email,
      phone,
      password_hash,
      status,
      id_card_url: null,
      id_card_uploaded_at: null,
    });

    // Generate 6-digit random numeric OTP for Student Registration
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);

    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await Student.setOtp(student.id, otpHash, expiresAt);

    // Send OTP via email and mobile SMS
    const textMsg = `Welcome to PMEC Student Portal!\n\nYour registration verification code is: ${otp}. It will expire in ${expiryMinutes} minutes.\n\nPlease enter this code to activate your account.`;
    console.log(`[AUTH] Student Registration OTP generated for ${student.email} & ${student.phone}: ${otp}`);
    sendMail({
      to: student.email,
      subject: 'PMEC Portal - Student Registration Verification Code',
      text: textMsg,
    });
    if (student.phone) {
      sendSMS({
        to: student.phone,
        message: `PMEC Portal: Your account registration verification code is ${otp}. Valid for ${expiryMinutes} mins.`,
      });
    }

    res.status(201).json({
      otpRequired: true,
      studentId: student.id,
      email: student.email,
      phone: student.phone,
      message: `A 6-digit verification code has been dispatched to your email (${student.email}) and mobile number (${student.phone || 'provided'}).`,
    });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'College Registration Number or email already registered.' });
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
}

async function loginStudent(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const student = await Student.findByEmail(email);
    if (!student) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, student.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    // Gate: Check unverified / pending status
    if (student.status === 'pending_otp') {
      return res.status(403).json({
        error: 'Registration verification incomplete. Please enter the OTP code sent to your email to activate your account.',
        pendingOtp: true,
        studentId: student.id,
        email: student.email,
      });
    }

    if (student.status === 'pending_verification') {
      return res.status(403).json({
        error: 'Your account is pending verification by the Institute. Please wait for an administrator to verify your credentials.',
      });
    }

    if (student.status === 'rejected') {
      return res.status(403).json({
        error: 'Your account registration was rejected by the Institute.',
      });
    }

    // Direct 1-Step Login without OTP
    const token = signToken({ id: student.id, role: 'student', email: student.email, name: student.name });
    const { password_hash, otp_code_hash, otp_expires_at, otp_attempts, ...safe } = student;
    res.json({ token, user: { ...safe, role: 'student' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
}

async function verifyStudentOtp(req, res) {
  try {
    const { studentId, otp } = req.body;
    if (!studentId || !otp) {
      return res.status(400).json({ error: 'Student ID and OTP code are required.' });
    }

    const student = await Student.findByIdWithOtp(studentId);
    if (!student) return res.status(404).json({ error: 'Student account not found.' });

    // Rate-limiting / lockout after 5 failed attempts
    if (student.otp_attempts >= 5) {
      return res.status(429).json({
        error: 'Too many incorrect attempts. For security reasons, please request a new OTP code.',
      });
    }

    // Check expiration
    if (!student.otp_expires_at || new Date() > new Date(student.otp_expires_at)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Verify OTP match
    const valid = await bcrypt.compare(otp.trim(), student.otp_code_hash || '');
    if (!valid) {
      await Student.incrementOtpAttempts(student.id);
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    // Official email domain verification gate
    const officialDomain = process.env.STUDENT_EMAIL_DOMAIN || '@pmec.ac.in';
    const isOfficial = student.email.toLowerCase().endsWith(officialDomain.toLowerCase()) || student.email.toLowerCase().endsWith('@pmec.edu');
    const finalStatus = isOfficial ? 'active' : 'pending_verification';

    const updated = await Student.activateAfterOtp(student.id, finalStatus);

    if (finalStatus === 'pending_verification') {
      return res.json({
        pendingVerification: true,
        message: 'Email verified successfully! Because you registered with a personal email, your account is pending verification by the Institute before you can log in.',
        user: { ...updated, role: 'student' },
      });
    }

    // Active instant JWT login
    const token = signToken({ id: updated.id, role: 'student', email: updated.email, name: updated.name });
    const { password_hash, otp_code_hash, otp_expires_at, otp_attempts, ...safe } = updated;
    res.json({ token, user: { ...safe, role: 'student' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OTP verification failed.' });
  }
}

async function resendStudentOtp(req, res) {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'Student ID is required.' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student account not found.' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await Student.setOtp(student.id, otpHash, expiresAt);

    console.log(`[AUTH] Resent Student Registration OTP for ${student.email} & ${student.phone}: ${otp}`);
    sendMail({
      to: student.email,
      subject: 'PMEC Portal - Resent Registration Verification Code',
      text: `Your new PMEC Student Portal registration verification code is: ${otp}. It will expire in ${expiryMinutes} minutes.`,
    });
    if (student.phone) {
      sendSMS({
        to: student.phone,
        message: `PMEC Portal: Your new registration verification code is ${otp}. Valid for ${expiryMinutes} mins.`,
      });
    }

    res.json({ message: 'A fresh verification code has been dispatched to your email and mobile number.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resend OTP code.' });
  }
}

// -------- Admin Login (Direct Login Without OTP) --------
async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const admin = await Admin.findByEmail(email);
    if (!admin) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    // Direct Login for Admin/Institute
    const token = signToken({
      id: admin.id,
      role: 'admin',
      email: admin.email,
      name: admin.name,
      office_role: admin.role,
    });
    const { password_hash, otp_code_hash, otp_expires_at, otp_attempts, ...safe } = admin;
    res.json({ token, user: { ...safe, role: 'admin', office_role: admin.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
}

async function verifyAdminOtp(req, res) {
  try {
    const { adminId, otp } = req.body;
    if (!adminId || !otp) {
      return res.status(400).json({ error: 'Admin ID and OTP code are required.' });
    }

    const admin = await Admin.findByIdWithOtp(adminId);
    if (!admin) return res.status(404).json({ error: 'Admin account not found.' });

    const token = signToken({
      id: admin.id,
      role: 'admin',
      email: admin.email,
      name: admin.name,
      office_role: admin.role,
    });
    const { password_hash, otp_code_hash, otp_expires_at, otp_attempts, ...safe } = admin;
    res.json({ token, user: { ...safe, role: 'admin', office_role: admin.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OTP verification failed.' });
  }
}

async function resendAdminOtp(req, res) {
  res.json({ message: 'Admin login does not require OTP.' });
}

async function me(req, res) {
  if (req.user.role === 'student') {
    const student = await Student.findById(req.user.id);
    return res.json({ ...student, role: 'student' });
  }
  const admin = await Admin.findById(req.user.id);
  return res.json({ ...admin, role: 'admin', office_role: admin.role });
}

module.exports = {
  registerStudent,
  loginStudent,
  verifyStudentOtp,
  resendStudentOtp,
  loginAdmin,
  verifyAdminOtp,
  resendAdminOtp,
  me,
  getCaptcha,
};
