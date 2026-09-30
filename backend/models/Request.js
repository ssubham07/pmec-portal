const db = require('../config/db');

const Request = {
  async create({ student_id, type, details, remarks }) {
    const { rows } = await db.query(
      `INSERT INTO requests (student_id, type, details, remarks)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [student_id, type, details || {}, remarks || null]
    );
    return rows[0];
  },
  async findById(id) {
    if (!id || isNaN(id)) return null;
    const { rows } = await db.query(
      `SELECT r.*, s.name AS student_name, s.roll_no, s.department AS student_department,
              s.semester AS student_semester, s.email AS student_email, s.phone AS student_phone
       FROM requests r JOIN students s ON s.id = r.student_id
       WHERE r.id = $1`,
      [id]
    );
    return rows[0];
  },
  async listByStudent(student_id) {
    const { rows } = await db.query(
      'SELECT * FROM requests WHERE student_id = $1 ORDER BY submitted_at DESC',
      [student_id]
    );
    return rows;
  },
  async listForAdmin({ status, type, department } = {}) {
    const clauses = [];
    const params = [];
    let i = 1;

    let sql = `SELECT r.*, s.name AS student_name, s.roll_no, s.department AS student_department,
                      s.semester AS student_semester
               FROM requests r JOIN students s ON s.id = r.student_id`;

    if (status) { clauses.push(`r.status = $${i++}`); params.push(status); }
    if (type) { clauses.push(`r.type = $${i++}`); params.push(type); }
    if (department) { clauses.push(`s.department = $${i++}`); params.push(department); }

    if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
    sql += ' ORDER BY r.submitted_at DESC';

    const { rows } = await db.query(sql, params);
    return rows;
  },
  async updateStatus(id, status, remarks) {
    const { rows } = await db.query(
      `UPDATE requests SET status = $1, remarks = COALESCE($2, remarks) WHERE id = $3 RETURNING *`,
      [status, remarks, id]
    );
    return rows[0];
  },
};

module.exports = Request;
