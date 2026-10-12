const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DOCUMENT_TYPES,
  validateDocumentFiles,
  validateFileType,
} = require('../src/utils/applicationDocuments');

test('documents are configured with the required roles', () => {
  assert.deepEqual(DOCUMENT_TYPES, {
    GRADE_8: 'Grade 8 certificate',
    GRADE_12: 'Grade 12 certificate',
    DEGREE: 'Degree certificate',
    CV: 'Curriculum vitae',
  });
});

test('all required education documents and CV are accepted when valid', () => {
  const files = {
    GRADE_8: { originalname: 'grade8.pdf', mimetype: 'application/pdf', size: 1024 },
    GRADE_12: { originalname: 'grade12.jpg', mimetype: 'image/jpeg', size: 1024 },
    DEGREE: { originalname: 'degree.png', mimetype: 'image/png', size: 1024 },
    CV: { originalname: 'cv.pdf', mimetype: 'application/pdf', size: 1024 },
  };

  assert.deepEqual(validateDocumentFiles(files), []);
});

test('missing documents return useful validation errors', () => {
  const errors = validateDocumentFiles({
    GRADE_8: undefined,
    GRADE_12: { originalname: 'grade12.pdf', mimetype: 'application/pdf', size: 1024 },
    DEGREE: undefined,
  });

  assert.deepEqual(errors, [
    'Grade 8 certificate is required.',
    'Degree certificate is required.',
    'Curriculum vitae is required.',
  ]);
});

test('unsupported file types and files over 5 MB are rejected', () => {
  assert.equal(validateFileType({ mimetype: 'application/x-executable', originalname: 'file.exe' }), false);
  assert.equal(validateFileType({ mimetype: 'application/pdf', originalname: 'large.pdf' }), true);
  assert.equal(validateDocumentFiles({
    GRADE_8: { originalname: 'grade8.pdf', mimetype: 'application/pdf', size: 5 * 1024 * 1024 + 1 },
    GRADE_12: { originalname: 'grade12.pdf', mimetype: 'application/pdf', size: 1 },
    DEGREE: { originalname: 'degree.pdf', mimetype: 'application/pdf', size: 1 },
    CV: { originalname: 'cv.pdf', mimetype: 'application/pdf', size: 1 },
  })[0], 'Grade 8 certificate must be 5 MB or smaller.');
});
