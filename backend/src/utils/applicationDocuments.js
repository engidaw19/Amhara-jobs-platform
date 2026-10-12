const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DOCUMENT_TYPES = Object.freeze({
  GRADE_8: 'Grade 8 certificate',
  GRADE_12: 'Grade 12 certificate',
  DEGREE: 'Degree certificate',
  CV: 'Curriculum vitae',
});

function validateFileType(file) {
  if (!file || !file.mimetype || !ALLOWED_MIME_TYPES.has(file.mimetype)) return false;
  return true;
}

function validateDocumentFiles(files = {}) {
  const errors = [];

  for (const [type, label] of Object.entries(DOCUMENT_TYPES)) {
    const file = files[type];
    if (!file) {
      errors.push(`${label} is required.`);
      continue;
    }
    if (!validateFileType(file)) {
      errors.push(`${label} must be a PDF, JPEG, or PNG file.`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${label} must be 5 MB or smaller.`);
    }
  }

  return errors;
}

module.exports = {
  DOCUMENT_TYPES,
  MAX_FILE_SIZE,
  validateFileType,
  validateDocumentFiles,
};
