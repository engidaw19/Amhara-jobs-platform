const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'applicant-documents');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (_, file, callback) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${uniqueId}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, callback) => {
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)) {
      callback(new Error('Only PDF, JPEG, and PNG files are allowed.'));
      return;
    }
    callback(null, true);
  },
});

module.exports = {
  upload,
  uploadDirectory,
};
