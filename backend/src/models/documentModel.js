const pool = require('../config/db');

const DOCUMENT_COLUMNS = `
  document_id, job_seeker_id, document_type, file_name, stored_file_name,
  file_path, mime_type, file_size, uploaded_at, updated_at
`;

async function findById(documentId) {
  const [rows] = await pool.execute(
    `SELECT ${DOCUMENT_COLUMNS} FROM job_seeker_documents WHERE document_id = ? LIMIT 1`,
    [documentId]
  );
  return rows[0] || null;
}

async function findByUserAndType(userId, documentType) {
  const [rows] = await pool.execute(
    `SELECT ${DOCUMENT_COLUMNS} FROM job_seeker_documents
     WHERE job_seeker_id = ? AND document_type = ? LIMIT 1`,
    [userId, documentType]
  );
  return rows[0] || null;
}

async function getAllForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT ${DOCUMENT_COLUMNS} FROM job_seeker_documents
     WHERE job_seeker_id = ? ORDER BY updated_at DESC`,
    [userId]
  );
  return rows;
}

async function saveDocument({ userId, documentType, file }) {
  const existing = await findByUserAndType(userId, documentType);
  if (existing) {
    await pool.execute(
      `UPDATE job_seeker_documents
       SET file_name = ?, stored_file_name = ?, file_path = ?, mime_type = ?, file_size = ?, updated_at = CURRENT_TIMESTAMP
       WHERE document_id = ?`,
      [file.originalname, file.filename, file.path, file.mimetype, file.size, existing.document_id]
    );
  } else {
    await pool.execute(
      `INSERT INTO job_seeker_documents
         (job_seeker_id, document_type, file_name, stored_file_name, file_path, mime_type, file_size)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, documentType, file.originalname, file.filename, file.path, file.mimetype, file.size]
    );
  }

  return findByUserAndType(userId, documentType);
}

module.exports = {
  findById,
  findByUserAndType,
  getAllForUser,
  saveDocument,
};
