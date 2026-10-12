const pool = require('../config/db');
const { success } = require('../utils/response');

/* ── Admin / Regional Admin Dashboard ── */
exports.getAdminStats = async (req, res, next) => {
  try {
    const [[users]]   = await pool.execute("SELECT COUNT(*) AS total_users, SUM(role='job_seeker') AS seeker_count FROM users");
    const [[jobs]]    = await pool.execute("SELECT COUNT(*) AS total_jobs, SUM(status='published') AS published_jobs, SUM(status='pending') AS pending_jobs FROM jobs");
    const [[apps]]    = await pool.execute('SELECT COUNT(*) AS total_applications FROM applications');
    const [[bureaus]] = await pool.execute("SELECT COUNT(*) AS total_bureaus FROM bureaus WHERE is_active=1");

    const [jobsByZone] = await pool.execute(
      `SELECT z.name_en AS zone, COUNT(j.id) AS count
       FROM zones z LEFT JOIN jobs j ON j.zone_id=z.id AND j.status='published'
       WHERE z.is_active=1 GROUP BY z.id ORDER BY count DESC LIMIT 13`
    );
    const [jobsByBureau] = await pool.execute(
      `SELECT b.name_en AS bureau, COUNT(j.id) AS count
       FROM bureaus b LEFT JOIN jobs j ON j.bureau_id=b.id AND j.status='published'
       WHERE b.is_active=1 GROUP BY b.id ORDER BY count DESC LIMIT 10`
    );
    const [monthlyTrend] = await pool.execute(
      `SELECT DATE_FORMAT(created_at,'%b %Y') AS month, COUNT(*) AS count
       FROM jobs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY MIN(created_at)`
    );

    return success(res, {
      total_users:         Number(users.total_users),
      total_jobs:          Number(jobs.total_jobs),
      published_jobs:      Number(jobs.published_jobs),
      pending_jobs:        Number(jobs.pending_jobs),
      total_applications:  Number(apps.total_applications),
      total_bureaus:       Number(bureaus.total_bureaus),
      jobs_by_zone:        jobsByZone,
      jobs_by_bureau:      jobsByBureau,
      monthly_trend:       monthlyTrend,
    });
  } catch (err) { next(err); }
};

/* ── Job Seeker Dashboard ── */
exports.getSeekerStats = async (req, res, next) => {
  try {
    const uid = req.user.id;

    const [[apps]] = await pool.execute(
      `SELECT
         COUNT(*)                          AS total_applications,
         SUM(status='applied')             AS applied,
         SUM(status='under_review')        AS under_review,
         SUM(status='shortlisted')         AS shortlisted,
         SUM(status='interview')           AS interview,
         SUM(status='accepted')            AS accepted,
         SUM(status='rejected')            AS rejected
       FROM applications WHERE applicant_id = ?`,
      [uid]
    );

    const [[notif]] = await pool.execute(
      'SELECT COUNT(*) AS unread_notifications FROM notifications WHERE user_id=? AND is_read=0',
      [uid]
    );

    const [recent] = await pool.execute(
      `SELECT a.id, a.status, a.applied_at, a.updated_at,
              j.id AS job_id, j.title_en AS job_title,
              b.name_en AS bureau_name
       FROM applications a
       JOIN jobs    j ON j.id = a.job_id
       JOIN bureaus b ON b.id = j.bureau_id
       WHERE a.applicant_id = ?
       ORDER BY a.applied_at DESC LIMIT 5`,
      [uid]
    );

    return success(res, {
      total_applications:   Number(apps.total_applications),
      applied:              Number(apps.applied),
      under_review:         Number(apps.under_review),
      shortlisted:          Number(apps.shortlisted),
      interview:            Number(apps.interview),
      accepted:             Number(apps.accepted),
      rejected:             Number(apps.rejected),
      unread_notifications: Number(notif.unread_notifications),
      recent_applications:  recent,
    });
  } catch (err) { next(err); }
};

/* ── Bureau Dashboard Stats ── */
exports.getBureauStats = async (req, res, next) => {
  try {
    const bureauId = req.params.bureauId;

    const [[jobs]] = await pool.execute(
      `SELECT COUNT(*) AS total_jobs,
              SUM(status='published') AS published_jobs,
              SUM(status='pending')   AS pending_jobs,
              SUM(status='draft')     AS draft_jobs
       FROM jobs WHERE bureau_id = ?`,
      [bureauId]
    );

    const [[apps]] = await pool.execute(
      `SELECT COUNT(*) AS total_applications,
              SUM(a.status='applied') AS new_applications
       FROM applications a JOIN jobs j ON j.id = a.job_id
       WHERE j.bureau_id = ?`,
      [bureauId]
    );

    const [recent] = await pool.execute(
      `SELECT j.id, j.title_en, j.status, j.deadline,
              COUNT(DISTINCT a.id) AS application_count
       FROM jobs j
       LEFT JOIN applications a ON a.job_id = j.id
       WHERE j.bureau_id = ?
       GROUP BY j.id
       ORDER BY j.created_at DESC LIMIT 5`,
      [bureauId]
    );

    const [[bureau]] = await pool.execute(
      'SELECT name_en AS bureau_name FROM bureaus WHERE id = ? LIMIT 1',
      [bureauId]
    );

    return success(res, {
      bureau_name:        bureau?.bureau_name,
      total_jobs:         Number(jobs.total_jobs),
      published_jobs:     Number(jobs.published_jobs),
      pending_jobs:       Number(jobs.pending_jobs),
      draft_jobs:         Number(jobs.draft_jobs),
      total_applications: Number(apps.total_applications),
      new_applications:   Number(apps.new_applications),
      recent_jobs:        recent,
    });
  } catch (err) { next(err); }
};
