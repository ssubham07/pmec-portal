const db = require('../config/db');

const RequestDocument = {
  async create({ request_id, file_url, doc_type }) {
    const { rows } = await db.query(
      `INSERT INTO request_documents (request_id, file_url, doc_type) VALUES ($1,$2,$3) RETURNING *`,
      [request_id, file_url, doc_type]
    );
    return rows[0];
  },
  async listByRequest(request_id) {
    const { rows } = await db.query(
      'SELECT * FROM request_documents WHERE request_id = $1 ORDER BY uploaded_at',
      [request_id]
    );
    return rows;
  },
};

module.exports = RequestDocument;
