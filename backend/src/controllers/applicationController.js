const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { canReviewApplication } = require('../utils/securityPolicies');
const { getMissingDocumentTypes } = require('../utils/documentValidation');

/* ── POST /api/jobs/:id/apply ── */
exports.apply = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const applicantId = req.user.id;

    if (req.user.role !== 'job_seeker')
      return error(res, 'Only job seekers can apply for jobs', 403);

    const [jobs] = await pool.execute(
      "SELECT id, status, deadline FROM jobs WHERE id = ? AND status = 'published' LIMIT 1",
      [jobId]
    );
    if (!jobs.length) return error(res, 'Job not found or no longer accepting applications', 404);

    if (jobs[0].deadline) {
      const dl = new Date(jobs[0].deadline);
      dl.setHours(23, 59, 59, 999);
      if (new Date() > dl) return error(res, 'The application deadline has passed', 400);
    }

    const [dup] = await pool.execute(
      'SELECT id FROM applications WHERE job_id=? AND applicant_id=? LIMIT 1',
      [jobId, applicantId]
    );
    if (dup.length) return error(res, 'You have already applied for this job', 409);

    const [documentRows] = await pool.execute(
      'SELECT document_type FROM job_seeker_documents WHERE job_seeker_id = ?',
      [applicantId]
    );
    const documentsByType = Object.fromEntries(
      documentRows.map(row => [row.document_type, row])
    );
    const missingDocuments = getMissingDocumentTypes(documentsByType);
    if (missingDocuments.length) {
      return error(res, `Required documents are missing: ${missingDocuments.join(', ')}`, 400);
    }

    const { cover_letter } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO applications (job_id, applicant_id, cover_letter, cv_url)
       VALUES (?, ?, ?, ?)`,
      [jobId, applicantId, cover_letter?.trim() || null, null]
    );

    await pool.execute(
      `INSERT INTO notifications (user_id, title_en, title_am, message, type, link)
       VALUES (?, 'Application Submitted', 'ማመልከቻ ቀርቧል',
               'Your application has been submitted successfully.', 'success', ?)`,
      [applicantId, `/dashboard/applications`]
    ).catch(() => {});

    return success(res, { applicationId: result.insertId }, 'Application submitted', 201);
  } catch (err) { next(err); }
};

/* ── GET /api/applications — own applications for job seeker ── */
exports.getMyApplications = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id, a.status, a.applied_at, a.updated_at,
              j.title_en, j.title_am, j.employment_type, j.deadline,
              b.name_en AS bureau_name,
              z.name_en AS zone_name
       FROM applications a
       JOIN jobs    j ON j.id = a.job_id
       JOIN bureaus b ON b.id = j.bureau_id
       LEFT JOIN zones z ON z.id = j.zone_id
       WHERE a.applicant_id = ?
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    return success(res, { applications: rows });
  } catch (err) { next(err); }
};

/* ── GET /api/bureau/:bureauId/applications ── */
exports.getBureauApplications = async (req, res, next) => {
  try {
    const { status, job_id } = req.query;
    let sql = `
      SELECT a.id, a.status, a.applied_at,
             u.full_name, u.email, u.phone,
             j.title_en AS job_title, j.id AS job_id
      FROM applications a
      JOIN users u ON u.id = a.applicant_id
      JOIN jobs  j ON j.id = a.job_id
      WHERE j.bureau_id = ?
    `;
    const params = [req.params.bureauId];
    if (status) { sql += ' AND a.status = ?'; params.push(status); }
    if (job_id) { sql += ' AND a.job_id = ?';  params.push(job_id); }
    sql += ' ORDER BY a.applied_at DESC';

    const [rows] = await pool.execute(sql, params);
    return success(res, { applications: rows });
  } catch (err) { next(err); }
};

/* ── PATCH /api/applications/:id/status ── */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, status_note } = req.body;
    const VALID = ['applied','under_review','shortlisted','interview','accepted','rejected'];
    if (!VALID.includes(status)) return error(res, 'Invalid status');

    const [apps] = await pool.execute(
      `SELECT a.id, j.bureau_id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (!apps.length) return error(res, 'Application not found', 404);

    const app = apps[0];
    if (!canReviewApplication(req.user, app.bureau_id))
      return error(res, 'Forbidden', 403);

    await pool.execute(
      'UPDATE applications SET status=?, status_note=? WHERE id=?',
      [status, status_note?.trim() || null, req.params.id]
    );

    // Notify applicant
    const [appRow] = await pool.execute(
      'SELECT applicant_id, job_id FROM applications WHERE id=? LIMIT 1',
      [req.params.id]
    );
    if (appRow.length) {
      await pool.execute(
        `INSERT INTO notifications (user_id, title_en, title_am, message, type, link)
         VALUES (?, 'Application Status Updated', 'የማመልከቻ ሁኔታ ተቀይሯል',
                 ?, 'info', '/dashboard/applications')`,
        [appRow[0].applicant_id, `Your application status changed to: ${status}`]
      ).catch(() => {});
    }

    return success(res, {}, 'Status updated');
  } catch (err) { next(err); }
};
