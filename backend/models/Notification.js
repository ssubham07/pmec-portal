const db = require('../config/db');

const Notification = {
  async create({ student_id, request_id, message, channel }) {
    const { rows } = await db.query(
      `INSERT INTO notifications (student_id, request_id, message, channel)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [student_id, request_id, message, channel || 'email']
    );
    return rows[0];
  },
  async listByStudent(student_id) {
    const { rows } = await db.query(
      `SELECT * FROM notifications WHERE student_id = $1 ORDER BY sent_at DESC`,
      [student_id]
    );
    return rows;
  },
};

module.exports = Notification;
