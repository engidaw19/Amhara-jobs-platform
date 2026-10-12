const pool = require('../config/db');
const { success, error } = require('../utils/response');

/* ── GET /api/applicants/profile ── */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      'SELECT * FROM seeker_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const [userRows] = await pool.execute(
      'SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    return success(res, { profile: rows[0] || null, user: userRows[0] || null });
  } catch (err) { next(err); }
};

/* ── PUT /api/applicants/profile ── upsert seeker profile + update user name/phone ── */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, headline, summary, date_of_birth, gender, address } = req.body;

    // Update user base info
    if (full_name || phone !== undefined) {
      const fields = [];
      const vals   = [];
      if (full_name) { fields.push('full_name = ?'); vals.push(full_name.trim()); }
      if (phone !== undefined) { fields.push('phone = ?'); vals.push(phone || null); }
      if (fields.length) {
        vals.push(userId);
        await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);
      }
    }

    // Upsert seeker_profiles
    await pool.execute(
      `INSERT INTO seeker_profiles (user_id, headline, summary, date_of_birth, gender, address)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         headline      = VALUES(headline),
         summary       = VALUES(summary),
         date_of_birth = VALUES(date_of_birth),
         gender        = VALUES(gender),
         address       = VALUES(address)`,
      [
        userId,
        headline || null,
        summary  || null,
        date_of_birth || null,
        gender   || null,
        address  || null,
      ]
    );

    return success(res, {}, 'Profile updated');
  } catch (err) { next(err); }
};
