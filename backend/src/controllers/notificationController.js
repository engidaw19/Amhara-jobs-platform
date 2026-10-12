const pool = require('../config/db');
const { success, error } = require('../utils/response');

exports.getNotifications = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, title_en, title_am, message, type, link, is_read, created_at
       FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    return success(res, { notifications: rows });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    return success(res, {}, 'Marked as read');
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0',
      [req.user.id]
    );
    return success(res, {}, 'All marked as read');
  } catch (err) { next(err); }
};

exports.dismiss = async (req, res, next) => {
  try {
    await pool.execute(
      'DELETE FROM notifications WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    return success(res, {}, 'Dismissed');
  } catch (err) { next(err); }
};
