const db = require('../config/db');

const Student = {
  async create({ roll_no, name, department, semester, email, phone, password_hash, status = 'active', id_card_url = null, id_card_uploaded_at = null }) {
    const { rows } = await db.query(
      `INSERT INTO students (roll_no, name, department, semester, email, phone, password_hash, status, id_card_url, id_card_uploaded_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, roll_no, name, department, semester, email, phone, status, id_card_url, id_card_uploaded_at`,
      [roll_no, name, department, semester, email, phone, password_hash, status, id_card_url, id_card_uploaded_at]
    );
    return rows[0];
  },
  async findByEmail(email) {
    const { rows } = await db.query('SELECT * FROM students WHERE email = $1', [email]);
    return rows[0];
  },
  async findById(id) {
    const { rows } = await db.query(
      'SELECT id, roll_no, name, department, semester, email, phone, status, id_card_url, id_card_uploaded_at, created_at FROM students WHERE id = $1',
      [id]
    );
    return rows[0];
  },
  async listPending() {
    const { rows } = await db.query(
      `SELECT id, roll_no, name, department, semester, email, phone, status, id_card_url, id_card_uploaded_at, created_at
       FROM students
       WHERE status = 'pending_verification'
       ORDER BY created_at DESC`
    );
    return rows;
  },
  async verify(id) {
    const { rows } = await db.query(
      `UPDATE students SET status = 'active' WHERE id = $1 RETURNING id, roll_no, name, email, department, semester, status, id_card_url`,
      [id]
    );
    return rows[0];
  },
  async reject(id) {
    const { rows } = await db.query(
      `UPDATE students SET status = 'rejected' WHERE id = $1 RETURNING id, roll_no, name, email, department, semester, status`,
      [id]
    );
    return rows[0];
  },
  async findByIdWithOtp(id) {
    const { rows } = await db.query(
      'SELECT id, roll_no, name, department, semester, email, phone, status, id_card_url, otp_code_hash, otp_expires_at, otp_attempts FROM students WHERE id = $1',
      [id]
    );
    return rows[0];
  },
  async findByEmailWithOtp(email) {
    const { rows } = await db.query(
      'SELECT id, roll_no, name, department, semester, email, phone, status, id_card_url, otp_code_hash, otp_expires_at, otp_attempts FROM students WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return rows[0];
  },
  async findByRollNoWithOtp(roll_no) {
    const { rows } = await db.query(
      'SELECT id, roll_no, name, department, semester, email, phone, status, id_card_url, otp_code_hash, otp_expires_at, otp_attempts FROM students WHERE roll_no = $1',
      [roll_no]
    );
    return rows[0];
  },
  async setOtp(id, otpCodeHash, expiresAt) {
    const { rows } = await db.query(
      `UPDATE students
       SET otp_code_hash = $1, otp_expires_at = $2, otp_attempts = 0
       WHERE id = $3
       RETURNING id, name, email, otp_expires_at`,
      [otpCodeHash, expiresAt, id]
    );
    return rows[0];
  },
  async incrementOtpAttempts(id) {
    const { rows } = await db.query(
      `UPDATE students
       SET otp_attempts = otp_attempts + 1
       WHERE id = $1
       RETURNING id, otp_attempts`,
      [id]
    );
    return rows[0];
  },
  async clearOtp(id) {
    await db.query(
      `UPDATE students
       SET otp_code_hash = NULL, otp_expires_at = NULL, otp_attempts = 0
       WHERE id = $1`,
      [id]
    );
  },
  async activateAfterOtp(id, status = 'active') {
    const { rows } = await db.query(
      `UPDATE students
       SET status = $1, otp_code_hash = NULL, otp_expires_at = NULL, otp_attempts = 0
       WHERE id = $2
       RETURNING id, roll_no, name, department, semester, email, phone, status, id_card_url`,
      [status, id]
    );
    return rows[0];
  },
};

module.exports = Student;
