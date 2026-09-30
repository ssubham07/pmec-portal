const db = require('../config/db');

const Student = {
  async create({ roll_no, name, department, semester, email, phone, password_hash, status = 'active' }) {
    const { rows } = await db.query(
      `INSERT INTO students (roll_no, name, department, semester, email, phone, password_hash, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, roll_no, name, department, semester, email, phone, status`,
      [roll_no, name, department, semester, email, phone, password_hash, status]
    );
    return rows[0];
  },
  async findByEmail(email) {
    const { rows } = await db.query('SELECT * FROM students WHERE email = $1', [email]);
    return rows[0];
  },
  async findById(id) {
    const { rows } = await db.query(
      'SELECT id, roll_no, name, department, semester, email, phone, status, created_at FROM students WHERE id = $1',
      [id]
    );
    return rows[0];
  },
  async listPending() {
    const { rows } = await db.query(
      `SELECT id, roll_no, name, department, semester, email, phone, status, created_at
       FROM students
       WHERE status = 'pending_verification'
       ORDER BY created_at DESC`
    );
    return rows;
  },
  async verify(id) {
    const { rows } = await db.query(
      `UPDATE students SET status = 'active' WHERE id = $1 RETURNING id, roll_no, name, email, department, semester, status`,
      [id]
    );
    return rows[0];
  },
};

module.exports = Student;
