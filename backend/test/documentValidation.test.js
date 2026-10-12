const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DOCUMENT_CONFIG,
  REQUIRED_DOCUMENT_TYPES,
  isAllowedMimeType,
  isAllowedExtension,
  getMissingDocumentTypes,
} = require('../src/utils/documentValidation');

test('documents use the requested public types and directories', () => {
  assert.deepEqual(REQUIRED_DOCUMENT_TYPES, ['CV', 'GRADE_8', 'GRADE_12', 'DEGREE']);
  assert.equal(DOCUMENT_CONFIG.CV.directory, 'cvs');
  assert.equal(DOCUMENT_CONFIG.GRADE_8.directory, 'certificates');
  assert.equal(DOCUMENT_CONFIG.DEGREE.directory, 'certificates');
});

test('MIME and extension validation rejects unsafe files', () => {
  assert.equal(isAllowedMimeType('CV', 'application/pdf'), true);
  assert.equal(isAllowedMimeType('CV', 'application/zip'), false);
  assert.equal(isAllowedMimeType('GRADE_8', 'image/png'), true);
  assert.equal(isAllowedExtension('CV', 'cv.PDF'), true);
  assert.equal(isAllowedExtension('CV', 'cv.exe'), false);
});

test('missing required documents are reported by type', () => {
  const stored = { CV: { document_type: 'CV' }, GRADE_8: { document_type: 'GRADE_8' } };
  assert.deepEqual(getMissingDocumentTypes(stored), ['GRADE_12', 'DEGREE']);
});
