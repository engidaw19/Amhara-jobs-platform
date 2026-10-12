const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { DOCUMENT_CONFIG, MAX_FILE_SIZE, isAllowedMimeType, isAllowedExtension } = require('../utils/documentValidation');

const uploadRoot = path.resolve(__dirname, '..', '..', 'uploads');
for (const directory of ['cvs', 'certificates']) {
  fs.mkdirSync(path.join(uploadRoot, directory), { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const directory = DOCUMENT_CONFIG[req.documentType]?.directory || 'certificates';
    callback(null, path.join(uploadRoot, directory));
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
    callback(null, safeName);
  },
});

const uploadMiddleware = (documentType) => (req, res, next) => {
  req.documentType = documentType;
  const fileFilter = (req, file, callback) => {
    if (!DOCUMENT_CONFIG[documentType]) {
      callback(new Error('Invalid document type.'));
      return;
    }
    if (!isAllowedMimeType(documentType, file.mimetype) || !isAllowedExtension(documentType, file.originalname)) {
      callback(new Error(`Invalid file type. Please upload a valid ${documentType} file.`));
      return;
    }
    callback(null, true);
  };

  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
  });

  upload.single('document')(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(Object.assign(new Error('File size must not exceed 5 MB.'), { status: 413 }));
      }
      return next(Object.assign(new Error(error.message), { status: 400 }));
    }
    if (!req.file) {
      return next(Object.assign(new Error('Please select a document to upload.'), { status: 400 }));
    }
    next();
  });
};

module.exports = { uploadMiddleware, uploadRoot };
