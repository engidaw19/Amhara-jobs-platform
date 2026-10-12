const REQUIRED_DOCUMENT_TYPES = Object.freeze(['CV', 'GRADE_8', 'GRADE_12', 'DEGREE']);

const DOCUMENT_CONFIG = Object.freeze({
  CV: {
    label: 'CV / Resume',
    directory: 'cvs',
    mimeTypes: new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    extensions: new Set(['pdf', 'doc', 'docx']),
  },
  GRADE_8: {
    label: 'Grade 8 Certificate',
    directory: 'certificates',
    mimeTypes: new Set(['application/pdf', 'image/jpeg', 'image/png']),
    extensions: new Set(['pdf', 'jpg', 'jpeg', 'png']),
  },
  GRADE_12: {
    label: 'Grade 12 Certificate',
    directory: 'certificates',
    mimeTypes: new Set(['application/pdf', 'image/jpeg', 'image/png']),
    extensions: new Set(['pdf', 'jpg', 'jpeg', 'png']),
  },
  DEGREE: {
    label: 'Degree Certificate',
    directory: 'certificates',
    mimeTypes: new Set(['application/pdf', 'image/jpeg', 'image/png']),
    extensions: new Set(['pdf', 'jpg', 'jpeg', 'png']),
  },
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isAllowedMimeType(documentType, mimeType) {
  return DOCUMENT_CONFIG[documentType]?.mimeTypes.has(mimeType) || false;
}

function isAllowedExtension(documentType, fileName) {
  const extension = String(fileName || '').split('.').pop().toLowerCase();
  return DOCUMENT_CONFIG[documentType]?.extensions.has(extension) || false;
}

function getMissingDocumentTypes(documents = {}) {
  return REQUIRED_DOCUMENT_TYPES.filter(type => !documents[type]);
}

module.exports = {
  DOCUMENT_CONFIG,
  REQUIRED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
  isAllowedMimeType,
  isAllowedExtension,
  getMissingDocumentTypes,
};
