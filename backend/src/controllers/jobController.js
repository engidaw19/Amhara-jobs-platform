const pool = require('../config/db');
const { success, error } = require('../utils/response');
const {
  isPublicJobStatus,
  getJobCreationStatus,
} = require('../utils/securityPolicies');

const BUREAU_ROLES = ['bureau_admin', 'bureau_staff'];

/* ─────────────────────────────────────────────────────────────
   GET /api/jobs  — Public search with filters
───────────────────────────────────────────────────────────────*/
exports.getJobs = async (req, res, next) => {
  try {
    const {
      q, bureau_id, zone_id, woreda_id, category_id,
      employment_type, experience_years, status,
    } = req.query;
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let sql = `
      SELECT j.id, j.title_en, j.title_am, j.employment_type,
             j.experience_years, j.salary_min, j.salary_max,
             j.salary_currency, j.positions, j.deadline,
             j.status, j.published_at, j.created_at,
             b.name_en AS bureau_name, b.name_am AS bureau_name_am,
             z.name_en AS zone_name,   z.name_am AS zone_name_am,
             w.name_en AS woreda_name,
             c.name_en AS category_name, c.icon AS category_icon,
             o.name AS org_name, o.logo_url AS org_logo
      FROM jobs j
      LEFT JOIN bureaus         b ON b.id = j.bureau_id
      LEFT JOIN zones           z ON z.id = j.zone_id
      LEFT JOIN woredas         w ON w.id = j.woreda_id
      LEFT JOIN job_categories  c ON c.id = j.category_id
      LEFT JOIN organizations   o ON o.id = j.organization_id
      WHERE 1=1
    `;
    const params = [];

    const jobStatus = isPublicJobStatus(status) ? status : 'published';
    sql += ' AND j.status = ?'; params.push(jobStatus);

    if (q) {
      sql += ' AND (j.title_en LIKE ? OR j.title_am LIKE ? OR j.description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (bureau_id)       { sql += ' AND j.bureau_id = ?';       params.push(bureau_id); }
    if (zone_id)         { sql += ' AND j.zone_id = ?';         params.push(zone_id); }
    if (woreda_id)       { sql += ' AND j.woreda_id = ?';       params.push(woreda_id); }
    if (category_id)     { sql += ' AND j.category_id = ?';     params.push(category_id); }
    if (employment_type) { sql += ' AND j.employment_type = ?'; params.push(employment_type); }
    if (experience_years){ sql += ' AND j.experience_years <= ?';params.push(experience_years); }

    // Count
    const countSql = sql.replace(
      /SELECT .* FROM jobs/s,
      'SELECT COUNT(*) AS total FROM jobs'
    );
    const [[{ total }]] = await pool.execute(countSql, params);

    sql += ` ORDER BY j.published_at DESC, j.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const [rows] = await pool.execute(sql, params);

    return success(res, {
      jobs:  rows,
      total: Number(total),
      pagination: { total: Number(total), page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

/* ── GET /api/jobs/:id ── */
exports.getJobById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT j.*,
              b.name_en AS bureau_name, b.name_am AS bureau_name_am,
              z.name_en AS zone_name,   z.name_am AS zone_name_am,
              w.name_en AS woreda_name,
              c.name_en AS category_name, c.icon AS category_icon,
              o.name AS org_name, o.logo_url AS org_logo,
              o.email AS org_email, o.phone AS org_phone
       FROM jobs j
       LEFT JOIN bureaus        b ON b.id = j.bureau_id
       LEFT JOIN zones          z ON z.id = j.zone_id
       LEFT JOIN woredas        w ON w.id = j.woreda_id
       LEFT JOIN job_categories c ON c.id = j.category_id
       LEFT JOIN organizations  o ON o.id = j.organization_id
       WHERE j.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return error(res, 'Job not found', 404);
    if ((!req.user || req.user.role === 'job_seeker') && !isPublicJobStatus(rows[0].status)) {
      return error(res, 'Job not found or job is not publicly available', 404);
    }

    const [skills] = await pool.execute(
      `SELECT s.id, s.name_en, s.name_am
       FROM job_skills js JOIN skills s ON s.id = js.skill_id
       WHERE js.job_id = ?`,
      [req.params.id]
    );

    return success(res, { job: { ...rows[0], skills } });
  } catch (err) { next(err); }
};

/* ── POST /api/jobs ── */
exports.createJob = async (req, res, next) => {
  try {
    const user = req.user;
    const {
      title_en, title_am, description, requirements,
      responsibilities, bureau_id, zone_id, woreda_id,
      city_id, category_id, organization_id, employment_type,
      education_level, experience_years, salary_min, salary_max,
      positions, gender_pref, deadline, skill_ids,
    } = req.body;

    if (!title_en?.trim())  return error(res, 'Job title (English) is required');
    if (!description?.trim()) return error(res, 'Job description is required');

    // Bureau-scoped users can only post for their own bureau
    const effectiveBureauId = BUREAU_ROLES.includes(user.role) ? user.bureau_id : bureau_id;
    if (!effectiveBureauId) return error(res, 'Bureau is required');

    const status = getJobCreationStatus(user.role);

    const [result] = await pool.execute(
      `INSERT INTO jobs
         (bureau_id, organization_id, posted_by, category_id, zone_id, woreda_id,
          city_id, title_en, title_am, description, requirements, responsibilities,
          education_level, experience_years, employment_type,
          salary_min, salary_max, positions, gender_pref, deadline, status,
          published_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        effectiveBureauId,
        organization_id || null,
        user.id,
        category_id     || null,
        zone_id         || null,
        woreda_id       || null,
        city_id         || null,
        title_en.trim(),
        title_am?.trim() || title_en.trim(),
        description.trim(),
        requirements?.trim()     || null,
        responsibilities?.trim() || null,
        education_level  || null,
        experience_years || null,
        employment_type  || 'full_time',
        salary_min       || null,
        salary_max       || null,
        positions        || 1,
        gender_pref      || 'any',
        deadline         || null,
        status,
        status === 'published' ? new Date() : null,
      ]
    );

    const jobId = result.insertId;

    // Attach skills
    if (Array.isArray(skill_ids) && skill_ids.length) {
      const vals = skill_ids.map(sid => [jobId, sid]);
      await pool.query('INSERT IGNORE INTO job_skills (job_id, skill_id) VALUES ?', [vals]);
    }

    // Audit
    await pool.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'JOB_CREATE', 'job', ?)`,
      [user.id, jobId]
    ).catch(() => {});

    return success(res, { id: jobId }, status === 'published' ? 'Job published' : 'Job submitted for approval', 201);
  } catch (err) { next(err); }
};

/* ── PUT /api/jobs/:id ── */
exports.updateJob = async (req, res, next) => {
  try {
    const user  = req.user;
    const jobId = req.params.id;

    const [existing] = await pool.execute('SELECT * FROM jobs WHERE id = ? LIMIT 1', [jobId]);
    if (!existing.length) return error(res, 'Job not found', 404);
    const job = existing[0];

    // Bureau staff can only edit their own bureau's jobs
    if (BUREAU_ROLES.includes(user.role) && job.bureau_id !== user.bureau_id) {
      return error(res, 'You can only edit jobs within your bureau', 403);
    }
    // Employers can only edit their own postings
    if (user.role === 'employer' && job.posted_by !== user.id) {
      return error(res, 'You can only edit your own job postings', 403);
    }

    const {
      title_en, title_am, description, requirements, responsibilities,
      zone_id, woreda_id, city_id, category_id, employment_type,
      education_level, experience_years, salary_min, salary_max,
      positions, gender_pref, deadline, status, skill_ids,
    } = req.body;

    const fields = []; const vals = [];
    const set = (col, val) => { if (val !== undefined) { fields.push(`${col}=?`); vals.push(val); } };
    set('title_en',         title_en?.trim());
    set('title_am',         title_am?.trim());
    set('description',      description?.trim());
    set('requirements',     requirements?.trim());
    set('responsibilities', responsibilities?.trim());
    set('zone_id',          zone_id);
    set('woreda_id',        woreda_id);
    set('city_id',          city_id);
    set('category_id',      category_id);
    set('employment_type',  employment_type);
    set('education_level',  education_level);
    set('experience_years', experience_years);
    set('salary_min',       salary_min || null);
    set('salary_max',       salary_max || null);
    set('positions',        positions);
    set('gender_pref',      gender_pref);
    set('deadline',         deadline || null);

    if (status && ADMIN_ROLES.includes(user.role)) {
      set('status', status);
      if (status === 'published' && job.status !== 'published') {
        fields.push('published_at=?'); vals.push(new Date());
      }
    }

    if (fields.length) {
      vals.push(jobId);
      await pool.execute(`UPDATE jobs SET ${fields.join(',')} WHERE id=?`, vals);
    }

    if (Array.isArray(skill_ids)) {
      await pool.execute('DELETE FROM job_skills WHERE job_id = ?', [jobId]);
      if (skill_ids.length) {
        const sv = skill_ids.map(sid => [jobId, sid]);
        await pool.query('INSERT IGNORE INTO job_skills (job_id, skill_id) VALUES ?', [sv]);
      }
    }

    return success(res, {}, 'Job updated');
  } catch (err) { next(err); }
};

/* ── DELETE /api/jobs/:id ── */
exports.deleteJob = async (req, res, next) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM jobs WHERE id = ? LIMIT 1', [req.params.id]);
    if (!existing.length) return error(res, 'Job not found', 404);
    const job = existing[0];

    if (BUREAU_ROLES.includes(req.user.role) && job.bureau_id !== req.user.bureau_id)
      return error(res, 'Forbidden', 403);

    await pool.execute('DELETE FROM jobs WHERE id = ?', [req.params.id]);
    return success(res, {}, 'Job deleted');
  } catch (err) { next(err); }
};

/* ── GET /api/jobs/:id/status ── check if current user applied ── */
exports.getApplicationStatus = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'job_seeker')
      return success(res, { applied: false, status: null });

    const [rows] = await pool.execute(
      'SELECT id, status FROM applications WHERE job_id=? AND applicant_id=? LIMIT 1',
      [req.params.id, req.user.id]
    );
    if (rows.length) return success(res, { applied: true, status: rows[0].status, applicationId: rows[0].id });
    return success(res, { applied: false, status: null });
  } catch (err) { next(err); }
};

/* ── GET /api/jobs/bureau/:bureauId ── bureau's own jobs ── */
exports.getBureauJobs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let sql = `
      SELECT j.id, j.title_en, j.title_am, j.employment_type,
             j.status, j.deadline, j.positions, j.created_at,
             z.name_en AS zone_name, c.name_en AS category_name,
             COUNT(DISTINCT a.id) AS application_count
      FROM jobs j
      LEFT JOIN zones          z ON z.id = j.zone_id
      LEFT JOIN job_categories c ON c.id = j.category_id
      LEFT JOIN applications   a ON a.job_id = j.id
      WHERE j.bureau_id = ?
    `;
    const params = [req.params.bureauId];
    if (status) { sql += ' AND j.status = ?'; params.push(status); }
    sql += ` GROUP BY j.id ORDER BY j.created_at DESC LIMIT ${Number(limit)} OFFSET ${offset}`;

    const [rows] = await pool.execute(sql, params);
    return success(res, { jobs: rows });
  } catch (err) { next(err); }
};

/* ── GET /api/jobs/categories ── public list of job categories ── */
exports.getCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name_en, name_am, icon FROM job_categories WHERE is_active = 1 ORDER BY name_en'
    );
    return success(res, { categories: rows });
  } catch (err) { next(err); }
};
