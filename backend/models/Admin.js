const db = require('../config/db');

const Admin = {
  async findByEmail(email) {
    const { rows } = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    return rows[0];
  },
  async findById(id) {
    const { rows } = await db.query(
      'SELECT id, name, role, department, email, signature_url, signature_updated_at FROM admins WHERE id = $1',
      [id]
    );
    return rows[0];
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
