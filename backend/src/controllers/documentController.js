const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const documentModel = require('../models/documentModel');
const { uploadRoot } = require('../middleware/uploadMiddleware');
const { DOCUMENT_CONFIG, REQUIRED_DOCUMENT_TYPES, getMissingDocumentTypes } = require('../utils/documentValidation');
const { success, error } = require('../utils/response');

const DOCUMENT_ROUTES = {
  cv: 'CV',
  grade8: 'GRADE_8',
  grade12: 'GRADE_12',
  degree: 'DEGREE',
};

function getDocumentPath(document) {
  const directory = DOCUMENT_CONFIG[document.document_type]?.directory || 'certificates';
  return path.join(uploadRoot, directory, document.stored_file_name);
}

async function uploadDocument(req, res, next) {
  try {
    const userId = req.user.id;
    const documentType = req.documentType;
    if (!documentType) return error(res, 'Invalid document type', 400);
    if (!req.file) return error(res, 'Please select a document to upload.', 400);

    const previous = await documentModel.findByUserAndType(userId, documentType);
    const directory = DOCUMENT_CONFIG[documentType].directory;
    const storedFileName = req.file.filename;
    const filePath = `/uploads/${directory}/${storedFileName}`;
    const saved = await documentModel.saveDocument({
      userId,
      documentType,
      file: { ...req.file, filename: storedFileName, path: filePath },
    });

    if (previous && previous.stored_file_name !== saved.stored_file_name) {
      const previousPath = getDocumentPath(previous);
      try { fs.unlinkSync(previousPath); } catch (removeError) {
        if (removeError.code !== 'ENOENT') console.error('Unable to remove previous document:', removeError.message);
      }
    }
    return success(res, {
      document: saved,
      documentsCompleted: await getDocumentCount(userId),
    }, `${DOCUMENT_CONFIG[documentType].label} uploaded`, 201);
  } catch (err) { next(err); }
}

async function getMyDocuments(req, res, next) {
  try {
    const documents = await documentModel.getAllForUser(req.user.id);
    const byType = Object.fromEntries(documents.map(document => [document.document_type, document]));
    return success(res, {
      documents: byType,
      completed: REQUIRED_DOCUMENT_TYPES.filter(type => byType[type]).length,
      total: REQUIRED_DOCUMENT_TYPES.length,
      missingDocuments: getMissingDocumentTypes(byType),
    });
  } catch (err) { next(err); }
}

async function viewDocument(req, res, next) {
  try {
    const document = await documentModel.findById(req.params.documentId);
    if (!document) return error(res, 'Document not found', 404);
    if (document.job_seeker_id !== req.user.id) return error(res, 'You cannot access this document', 403);

    const filePath = getDocumentPath(document);
    if (!fs.existsSync(filePath)) return error(res, 'Document file is missing', 404);
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`);
    return fs.createReadStream(filePath).pipe(res);
  } catch (err) { next(err); }
}

async function deleteDocument(req, res, next) {
  try {
    const document = await documentModel.findById(req.params.documentId);
    if (!document) return error(res, 'Document not found', 404);
    if (document.job_seeker_id !== req.user.id) return error(res, 'You cannot delete this document', 403);

    const filePath = getDocumentPath(document);
    try { fs.unlinkSync(filePath); } catch (removeError) {
      if (removeError.code !== 'ENOENT') console.error('Unable to remove document:', removeError.message);
    }
    await pool.execute('DELETE FROM job_seeker_documents WHERE document_id = ?', [document.document_id]);
    return success(res, {}, 'Document deleted');
  } catch (err) { next(err); }
}

async function getDocumentCount(userId) {
  const [rows] = await pool.execute(
    `SELECT document_type FROM job_seeker_documents WHERE job_seeker_id = ?`,
    [userId]
  );
  return rows.filter(row => REQUIRED_DOCUMENT_TYPES.includes(row.document_type)).length;
}

module.exports = {
  uploadDocument,
  getMyDocuments,
  viewDocument,
  deleteDocument,
};
