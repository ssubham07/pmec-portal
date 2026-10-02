const db = require('../config/db');

const Admin = {
  async findByEmail(email) {
    if (!email) return null;
    const { rows } = await db.query('SELECT * FROM admins WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    return rows[0];
  },
  async findById(id) {
    const { rows } = await db.query(
      'SELECT id, name, role, department, email, signature_url, signature_updated_at FROM admins WHERE id = $1',
      [id]
    );
    return rows[0];
  },
  async findByIdWithOtp(id) {
    const { rows } = await db.query(
      'SELECT id, name, role, department, email, signature_url, signature_updated_at, otp_code_hash, otp_expires_at, otp_attempts FROM admins WHERE id = $1',
      [id]
    );
    return rows[0];
  },
  async setOtp(id, otpCodeHash, expiresAt) {
    const { rows } = await db.query(
      `UPDATE admins
       SET otp_code_hash = $1, otp_expires_at = $2, otp_attempts = 0
       WHERE id = $3
       RETURNING id, name, email, otp_expires_at`,
      [otpCodeHash, expiresAt, id]
    );
    return rows[0];
  },
  async incrementOtpAttempts(id) {
    const { rows } = await db.query(
      `UPDATE admins
       SET otp_attempts = otp_attempts + 1
       WHERE id = $1
       RETURNING id, otp_attempts`,
      [id]
    );
    return rows[0];
  },
  async clearOtp(id) {
    await db.query(
      `UPDATE admins
       SET otp_code_hash = NULL, otp_expires_at = NULL, otp_attempts = 0
       WHERE id = $1`,
      [id]
    );
  },
  async updateSignature(id, signatureUrl) {
    const { rows } = await db.query(
      `UPDATE admins SET signature_url = $1, signature_updated_at = now() WHERE id = $2
       RETURNING id, name, signature_url, signature_updated_at`,
      [signatureUrl, id]
    );
    return rows[0];
  },
};

module.exports = Admin;
