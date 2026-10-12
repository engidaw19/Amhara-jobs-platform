const { verifyToken } = require('../utils/jwt');
const pool = require('../config/db');

module.exports = async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, role, bureau_id, is_active, must_change_pw FROM users WHERE id = ? LIMIT 1',
      [payload.id]
    );
    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Account not found or inactive' });
    }
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
