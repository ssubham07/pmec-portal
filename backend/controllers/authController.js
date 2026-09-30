const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { createCaptcha, verifyCaptcha } = require('../utils/captcha');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
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
      return res.status(400).json({ error: 'roll_no, name, department, semester, email and password are required.' });
    }

    const existing = await Student.findByEmail(email);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    // Official email domain verification gate
    const officialDomain = process.env.STUDENT_EMAIL_DOMAIN || '@pmec.ac.in';
    const isOfficial = email.toLowerCase().endsWith(officialDomain.toLowerCase()) || email.toLowerCase().endsWith('@pmec.edu');
    const status = isOfficial ? 'active' : 'pending_verification';

    const password_hash = await bcrypt.hash(password, 10);
    const student = await Student.create({ roll_no, name, department, semester, email, phone, password_hash, status });

    if (status === 'pending_verification') {
      return res.status(201).json({
        message: 'Registration submitted. Because you registered with a personal email, your account is pending verification by the Institute before you can log in.',
        pendingVerification: true,
        user: { ...student, role: 'student' },
      });
    }

    const token = signToken({ id: student.id, role: 'student', email: student.email, name: student.name });
    res.status(201).json({ token, user: { ...student, role: 'student' } });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Roll number or email already registered.' });
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
}

async function loginStudent(req, res) {
  try {
    const { email, password, captchaInput, captchaId } = req.body;

    // Verify Captcha
    if (!captchaInput || !captchaId || !verifyCaptcha(captchaId, captchaInput)) {
      return res.status(400).json({ error: 'Invalid or expired captcha. Please enter the characters shown.' });
    }

    const student = await Student.findByEmail(email);
    if (!student) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, student.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    // Gate: Block unverified students
    if (student.status === 'pending_verification') {
      return res.status(403).json({
        error: 'Your account is pending verification by the Institute. Please wait for an administrator to verify your credentials.',
      });
    }

    const token = signToken({ id: student.id, role: 'student', email: student.email, name: student.name });
    const { password_hash, ...safe } = student;
    res.json({ token, user: { ...safe, role: 'student' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
}

// -------- Admin --------
async function loginAdmin(req, res) {
  try {
    const { email, password, captchaInput, captchaId } = req.body;

    // Verify Captcha
    if (!captchaInput || !captchaId || !verifyCaptcha(captchaId, captchaInput)) {
      return res.status(400).json({ error: 'Invalid or expired captcha. Please enter the characters shown.' });
    }

    const admin = await Admin.findByEmail(email);
    if (!admin) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken({ id: admin.id, role: 'admin', email: admin.email, name: admin.name });
    const { password_hash, ...safe } = admin;
    res.json({ token, user: { ...safe, role: 'admin' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
}

async function me(req, res) {
  if (req.user.role === 'student') {
    const student = await Student.findById(req.user.id);
    return res.json({ ...student, role: 'student' });
  }
  const admin = await Admin.findById(req.user.id);
  return res.json({ ...admin, role: 'admin' });
}

module.exports = { registerStudent, loginStudent, loginAdmin, me, getCaptcha };
