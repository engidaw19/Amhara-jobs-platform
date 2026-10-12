const pool = require('../config/db');
const { success, error } = require('../utils/response');

exports.getAnnouncements = async (req, res, next) => {
  try {
    const { bureau_id } = req.query;
    let sql = `
      SELECT a.id, a.title_en, a.title_am, a.content,
             a.expires_at, a.created_at,
             b.name_en AS bureau_name,
             u.full_name AS posted_by_name
      FROM announcements a
      LEFT JOIN bureaus b ON b.id = a.bureau_id
      JOIN  users  u ON u.id = a.posted_by
      WHERE a.is_published = 1
        AND (a.expires_at IS NULL OR a.expires_at >= CURDATE())
    `;
    const params = [];
    if (bureau_id) { sql += ' AND (a.bureau_id = ? OR a.bureau_id IS NULL)'; params.push(bureau_id); }
    sql += ' ORDER BY a.created_at DESC LIMIT 20';
    const [rows] = await pool.execute(sql, params);
    return success(res, { announcements: rows });
  } catch (err) { next(err); }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const user = req.user;
    const { title_en, title_am, content, bureau_id, expires_at } = req.body;
    if (!title_en?.trim() || !content?.trim())
      return error(res, 'Title and content are required');

    const effectiveBureauId = ['bureau_admin','bureau_staff'].includes(user.role)
      ? user.bureau_id
      : (bureau_id || null);

    const [r] = await pool.execute(
      `INSERT INTO announcements (bureau_id, posted_by, title_en, title_am, content, expires_at)
       VALUES (?,?,?,?,?,?)`,
      [effectiveBureauId, user.id, title_en.trim(), title_am?.trim() || '', content.trim(), expires_at || null]
    );
    return success(res, { id: r.insertId }, 'Announcement created', 201);
  } catch (err) { next(err); }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    const { title_en, title_am, content, expires_at, is_published } = req.body;
    await pool.execute(
      `UPDATE announcements SET
         title_en     = COALESCE(?, title_en),
         title_am     = COALESCE(?, title_am),
         content      = COALESCE(?, content),
         expires_at   = COALESCE(?, expires_at),
         is_published = COALESCE(?, is_published)
       WHERE id=?`,
      [title_en?.trim(), title_am?.trim(), content?.trim(), expires_at || null, is_published ?? null, req.params.id]
    );
    return success(res, {}, 'Announcement updated');
  } catch (err) { next(err); }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM announcements WHERE id=?', [req.params.id]);
    return success(res, {}, 'Deleted');
  } catch (err) { next(err); }
};
