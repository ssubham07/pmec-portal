const db = require('../config/db');

const ApprovalLog = {
  async create({ request_id, admin_id, action, comment, signature_url }) {
    const { rows } = await db.query(
      `INSERT INTO approval_logs (request_id, admin_id, action, comment, signature_url)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [request_id, admin_id, action, comment, signature_url || null]
    );
    return rows[0];
  },
  async listByRequest(request_id) {
    const { rows } = await db.query(
      `SELECT al.*, a.name AS admin_name, a.role AS admin_role
       FROM approval_logs al LEFT JOIN admins a ON a.id = al.admin_id
       WHERE al.request_id = $1 ORDER BY al."timestamp" ASC`,
      [request_id]
    );
    return rows;
  },
};

module.exports = ApprovalLog;
