const pool = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');

/* ── POST /api/auth/register ── */
exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, phone } = req.body;
    if (!full_name?.trim()) return error(res, 'Full name is required');
    if (!email?.trim())     return error(res, 'Email is required');
    if (!password || password.length < 8)
      return error(res, 'Password must be at least 8 characters');

    const [dup] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );
    if (dup.length) return error(res, 'Email already registered', 409);

    const hash = await hashPassword(password);
    const [result] = await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, 'job_seeker')`,
      [full_name.trim(), email.trim().toLowerCase(), hash, phone?.trim() || null]
    );

    const token = signToken({ id: result.insertId, role: 'job_seeker' });
    return success(res, {
      token,
      user: { id: result.insertId, full_name: full_name.trim(), email: email.trim().toLowerCase(), role: 'job_seeker' },
    }, 'Registration successful', 201);
  } catch (err) { next(err); }
};

/* ── POST /api/auth/login ── */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password are required');

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, password_hash, role, bureau_id,
              is_active, must_change_pw
       FROM users WHERE email = ? LIMIT 1`,
      [email.trim().toLowerCase()]
    );
    if (!rows.length) return error(res, 'Invalid credentials', 401);

    const user = rows[0];
    if (!user.is_active) return error(res, 'Your account has been suspended', 403);

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) return error(res, 'Invalid credentials', 401);

    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = signToken({ id: user.id, role: user.role, bureau_id: user.bureau_id });
    return success(res, {
      token,
      user: {
        id: user.id, full_name: user.full_name, email: user.email,
        role: user.role, bureau_id: user.bureau_id,
        must_change_pw: Boolean(user.must_change_pw),
      },
    }, 'Login successful');
  } catch (err) { next(err); }
};

/* ── POST /api/auth/change-password ── */
exports.changePassword = async (req, res, next) => {
  try {
    // Accept both naming conventions from the frontend
    const currentPassword = req.body.current_password || req.body.currentPassword;
    const newPassword     = req.body.new_password     || req.body.newPassword;

    if (!currentPassword || !newPassword)
      return error(res, 'Current and new passwords are required');
    if (newPassword.length < 8)
      return error(res, 'New password must be at least 8 characters');

    const [rows] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rows.length) return error(res, 'Account not found', 404);
    const valid = await comparePassword(currentPassword, rows[0].password_hash);
    if (!valid) return error(res, 'Current password is incorrect', 401);
    if (currentPassword === newPassword)
      return error(res, 'New password must differ from current password');

    const hash = await hashPassword(newPassword);
    await pool.execute(
      'UPDATE users SET password_hash = ?, must_change_pw = 0 WHERE id = ?',
      [hash, req.user.id]
    );
    return success(res, {}, 'Password updated successfully');
  } catch (err) { next(err); }
};

/* ── GET /api/auth/me ── */
exports.me = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, role, bureau_id, is_active,
              must_change_pw, last_login, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    );
    return success(res, { user: rows[0] });
  } catch (err) { next(err); }
};
