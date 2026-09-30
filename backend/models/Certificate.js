const db = require('../config/db');

const Certificate = {
  async create({ request_id, certificate_no, pdf_url, signed_by }) {
    const { rows } = await db.query(
      `INSERT INTO certificates (request_id, certificate_no, pdf_url, signed_by)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [request_id, certificate_no, pdf_url, signed_by]
    );
    return rows[0];
  },
  async findByRequest(request_id) {
    const { rows } = await db.query('SELECT * FROM certificates WHERE request_id = $1', [request_id]);
    return rows[0];
  },
};

module.exports = Certificate;
