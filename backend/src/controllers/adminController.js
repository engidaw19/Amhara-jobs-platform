const pool = require('../config/db');
const { hashPassword } = require('../utils/hash');
const { getTemporaryPassword } = require('../utils/temporaryPassword');
const { success, error } = require('../utils/response');

/* ── Users management ── */
exports.getUsers = async (req, res, next) => {
  try {
    const { role, bureau_id, q } = req.query;
    let sql = `SELECT id, full_name, email, phone, role, bureau_id, is_active, created_at
               FROM users WHERE 1=1`;
    const params = [];
    if (role)      { sql += ' AND role=?';       params.push(role); }
    if (bureau_id) { sql += ' AND bureau_id=?';  params.push(bureau_id); }
    if (q)         { sql += ' AND (full_name LIKE ? OR email LIKE ?)'; params.push(`%${q}%`,`%${q}%`); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(sql, params);
    return success(res, { users: rows });
  } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
  try {
    const { full_name, email, role, bureau_id, phone } = req.body;
    if (!full_name?.trim() || !email?.trim())
      return error(res, 'full_name and email are required');

    const [dup] = await pool.execute('SELECT id FROM users WHERE email=? LIMIT 1', [email.trim().toLowerCase()]);
    if (dup.length) return error(res, 'Email already registered', 409);

    const temporaryPassword = getTemporaryPassword();
    const hash = await hashPassword(temporaryPassword);
    const [r] = await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, phone, role, bureau_id, is_active, must_change_pw)
       VALUES (?,?,?,?,?,?,1,1)`,
      [full_name.trim(), email.trim().toLowerCase(), hash, phone?.trim() || null, role || 'job_seeker', bureau_id || null]
    );

    // Audit
    await pool.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'USER_CREATE', 'user', ?)`,
      [req.user.id, r.insertId]
    ).catch(() => {});

    return success(res, { id: r.insertId, temporaryPassword }, 'User created', 201);
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { full_name, email, role, bureau_id, phone, is_active } = req.body;
    if (Number(req.params.id) === req.user.id && role && role !== 'super_admin')
      return error(res, 'You cannot demote your own account');

    await pool.execute(
      `UPDATE users SET
         full_name = COALESCE(?, full_name),
         email     = COALESCE(?, email),
         role      = COALESCE(?, role),
         bureau_id = COALESCE(?, bureau_id),
         phone     = COALESCE(?, phone),
         is_active = COALESCE(?, is_active)
       WHERE id=?`,
      [full_name?.trim(), email?.trim().toLowerCase(), role, bureau_id || null, phone?.trim(), is_active ?? null, req.params.id]
    );
    return success(res, {}, 'User updated');
  } catch (err) { next(err); }
};

exports.resetUserPassword = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (targetId === req.user.id) return error(res, 'Use Change Password to update your own password');

    const [rows] = await pool.execute('SELECT email FROM users WHERE id=? LIMIT 1', [targetId]);
    if (!rows.length) return error(res, 'User not found', 404);

    const tempPw = getTemporaryPassword();
    const hash = await hashPassword(tempPw);

    await pool.execute(
      'UPDATE users SET password_hash=?, must_change_pw=1 WHERE id=?',
      [hash, targetId]
    );
    await pool.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'PASSWORD_RESET', 'user', ?, ?)`,
      [req.user.id, targetId, JSON.stringify({ targetEmail: rows[0].email })]
    ).catch(() => {});

    return success(res, { temporaryPassword: tempPw }, 'Password reset successfully');
  } catch (err) { next(err); }
};

/* ── Approve / Reject jobs ── */
exports.approveJob = async (req, res, next) => {
  try {
    await pool.execute(
      "UPDATE jobs SET status='published', published_at=NOW() WHERE id=?",
      [req.params.id]
    );
    return success(res, {}, 'Job approved and published');
  } catch (err) { next(err); }
};

exports.rejectJob = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await pool.execute(
      "UPDATE jobs SET status='rejected', rejection_reason=? WHERE id=?",
      [reason?.trim() || null, req.params.id]
    );
    return success(res, {}, 'Job rejected');
  } catch (err) { next(err); }
};

/* ── All Applications (admin view) ── */
exports.getAllApplications = async (req, res, next) => {
  try {
    const { bureau_id, status, job_id, q } = req.query;

    let sql = `
      SELECT
        a.id,
        a.status,
        a.applied_at,
        a.updated_at,
        a.cover_letter,
        a.status_note,
        u.id          AS applicant_id,
        u.full_name   AS applicant_name,
        u.email       AS applicant_email,
        u.phone       AS applicant_phone,
        j.id          AS job_id,
        j.title_en    AS job_title,
        j.employment_type,
        j.deadline,
        b.id          AS bureau_id,
        b.name_en     AS bureau_name
      FROM applications a
      JOIN users    u ON u.id = a.applicant_id
      JOIN jobs     j ON j.id = a.job_id
      JOIN bureaus  b ON b.id = j.bureau_id
      WHERE 1=1
    `;
    const params = [];

    if (bureau_id) { sql += ' AND b.id = ?';      params.push(bureau_id); }
    if (status)    { sql += ' AND a.status = ?';   params.push(status); }
    if (job_id)    { sql += ' AND a.job_id = ?';   params.push(job_id); }
    if (q) {
      sql += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR j.title_en LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += ' ORDER BY a.applied_at DESC';

    const [applications] = await pool.execute(sql, params);

    // Attach documents per applicant (batch to avoid N+1)
    const applicantIds = [...new Set(applications.map(r => r.applicant_id))];
    let documentsByApplicant = {};
    if (applicantIds.length) {
      const placeholders = applicantIds.map(() => '?').join(',');
      const [docs] = await pool.execute(
        `SELECT job_seeker_id, document_type, file_name, stored_file_name, file_path, mime_type, file_size, uploaded_at
         FROM job_seeker_documents
         WHERE job_seeker_id IN (${placeholders})`,
        applicantIds
      );
      for (const doc of docs) {
        if (!documentsByApplicant[doc.job_seeker_id]) documentsByApplicant[doc.job_seeker_id] = [];
        documentsByApplicant[doc.job_seeker_id].push(doc);
      }
    }

    const result = applications.map(a => ({
      ...a,
      documents: documentsByApplicant[a.applicant_id] || [],
    }));

    return success(res, { applications: result, total: result.length });
  } catch (err) { next(err); }
};

/* ── Audit Logs ── */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT l.id, l.action, l.entity_type, l.entity_id, l.ip_address, l.created_at,
              u.full_name AS user_name, u.email AS user_email
       FROM audit_logs l
       LEFT JOIN users u ON u.id = l.user_id
       ORDER BY l.created_at DESC LIMIT 100`
    );
    return success(res, { logs: rows });
  } catch (err) { next(err); }
};
