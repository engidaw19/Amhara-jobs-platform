module.exports = function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message || err);
  const status  = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ success: false, message });
};
