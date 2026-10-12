module.exports = function uploadErrorHandler(error, req, res, next) {
  if (error && (error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_UNEXPECTED_FILE')) {
    return res.status(413).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE'
      ? 'File size must not exceed 5 MB.'
      : 'Invalid file upload.' });
  }
  if (error?.message) {
    return res.status(400).json({ success: false, message: error.message });
  }
  next(error);
};
