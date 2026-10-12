const pool = require('../config/db');
const { success, error } = require('../utils/response');

/* ── GET /api/bureaus ── */
exports.getBureaus = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT b.id, b.name_en, b.name_am, b.short_code,
              b.description, b.logo_url, b.email, b.phone,
              b.is_active,
              COUNT(DISTINCT j.id) AS active_jobs
       FROM bureaus b
       LEFT JOIN jobs j ON j.bureau_id = b.id AND j.status = 'published'
       WHERE b.is_active = 1
       GROUP BY b.id ORDER BY b.name_en`
    );
    return success(res, { bureaus: rows });
  } catch (err) { next(err); }
};

/* ── GET /api/bureaus/:id ── */
exports.getBureauById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM bureaus WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    if (!rows.length) return error(res, 'Bureau not found', 404);
    const bureau = rows[0];

    const [jobs] = await pool.execute(
      `SELECT j.id, j.title_en, j.title_am, j.employment_type,
              j.deadline, j.status, z.name_en AS zone_name
       FROM jobs j
       LEFT JOIN zones z ON z.id = j.zone_id
       WHERE j.bureau_id = ? AND j.status = 'published'
       ORDER BY j.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    const [depts] = await pool.execute(
      'SELECT id, name_en, name_am FROM departments WHERE bureau_id = ? AND is_active = 1',
      [req.params.id]
    );

    return success(res, { bureau, recent_jobs: jobs, departments: depts });
  } catch (err) { next(err); }
};

/* ── POST /api/admin/bureaus ── */
exports.createBureau = async (req, res, next) => {
  try {
    const { name_en, name_am, short_code, description, email, phone, website } = req.body;
    if (!name_en?.trim()) return error(res, 'Bureau name (English) is required');

    const [r] = await pool.execute(
      `INSERT INTO bureaus (name_en, name_am, short_code, description, email, phone, website)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name_en.trim(),
        name_am?.trim() || name_en.trim(),
        short_code?.trim() || null,
        description?.trim() || null,
        email?.trim() || null,
        phone?.trim() || null,
        website?.trim() || null,
      ]
    );
    return success(res, { id: r.insertId }, 'Bureau created', 201);
  } catch (err) { next(err); }
};

/* ── PUT /api/admin/bureaus/:id ── */
exports.updateBureau = async (req, res, next) => {
  try {
    const { name_en, name_am, short_code, description, email, phone, website, is_active } = req.body;
    await pool.execute(
      `UPDATE bureaus SET
         name_en     = COALESCE(?, name_en),
         name_am     = COALESCE(?, name_am),
         short_code  = COALESCE(?, short_code),
         description = COALESCE(?, description),
         email       = COALESCE(?, email),
         phone       = COALESCE(?, phone),
         website     = COALESCE(?, website),
         is_active   = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        name_en?.trim(), name_am?.trim(), short_code?.trim(),
        description?.trim(), email?.trim(), phone?.trim(), website?.trim(),
        is_active ?? null,
        req.params.id,
      ]
    );
    return success(res, {}, 'Bureau updated');
  } catch (err) { next(err); }
};

/* ── GET /api/bureaus/:id/stats (bureau dashboard) ── */
exports.getBureauStats = async (req, res, next) => {
  try {
    const bid = req.params.id;
    const [[totals]] = await pool.execute(
      `SELECT
         COUNT(*) AS total_jobs,
         SUM(status = 'published') AS active_jobs,
         SUM(status = 'pending')   AS pending_jobs,
         SUM(status = 'expired')   AS expired_jobs
       FROM jobs WHERE bureau_id = ?`,
      [bid]
    );
    const [[appTotals]] = await pool.execute(
      `SELECT
         COUNT(*) AS total_applications,
         SUM(a.status = 'shortlisted') AS shortlisted,
         SUM(a.status = 'accepted')    AS hired
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE j.bureau_id = ?`,
      [bid]
    );
    return success(res, { stats: { ...totals, ...appTotals } });
  } catch (err) { next(err); }
};
