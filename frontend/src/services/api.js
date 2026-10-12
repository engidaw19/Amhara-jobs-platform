const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(method, path, body) {
  const token = localStorage.getItem('ajp_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body !== undefined) opts.body = body instanceof FormData ? body : JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

function qs(params) {
  if (!params) return '';
  const p = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!p.length) return '';
  return '?' + p.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────
  register:       (d)    => request('POST',  '/auth/register', d),
  login:          (d)    => request('POST',  '/auth/login', d),
  me:             ()     => request('GET',   '/auth/me'),
  changePassword: (d)    => request('POST',  '/auth/change-password', d),

  // ── Jobs ──────────────────────────────────────────────────
  getJobs:        (q)    => request('GET',   `/jobs${qs(q)}`),
  getJobById:     (id)   => request('GET',   `/jobs/${id}`),
  getJobStatus:   (id)   => request('GET',   `/jobs/${id}/status`),
  createJob:      (d)    => request('POST',  '/jobs', d),
  updateJob:      (id, d)=> request('PUT',   `/jobs/${id}`, d),
  deleteJob:      (id)   => request('DELETE',`/jobs/${id}`),
  // Bureau-scoped jobs — correct route from backend
  getBureauJobs:  (bid, q) => request('GET', `/jobs/bureau/${bid}${qs(q)}`),

  // ── Applications ──────────────────────────────────────────
  apply:               (id, d) => request('POST',  `/applications/${id}/apply`, d),
  getMyApplications:   ()      => request('GET',   '/applications/my'),
  // Bureau-scoped applications — correct route from backend
  getBureauApplications: (bid, q) => request('GET', `/applications/bureau/${bid}${qs(q)}`),
  updateAppStatus:     (id, d) => request('PATCH', `/applications/${id}/status`, d),

  // ── Applicant Documents ──────────────────────────────────────
  getMyDocuments: () => request('GET', '/documents/my-documents'),
  uploadDocument: (endpoint, formData) => request('POST', `/documents/${endpoint}`, formData),
  deleteDocument: (id) => request('DELETE', `/documents/${id}`),

  // ── Bureaus ───────────────────────────────────────────────
  getBureaus:   ()       => request('GET',  '/bureaus'),
  getBureauById:(id)     => request('GET',  `/bureaus/${id}`),
  getBureauStats:(id)    => request('GET',  `/bureaus/${id}/stats`),
  createBureau: (d)      => request('POST', '/bureaus', d),
  updateBureau: (id, d)  => request('PUT',  `/bureaus/${id}`, d),

  // ── Locations ─────────────────────────────────────────────
  getZones:     ()       => request('GET',  '/zones'),
  getZoneTree:  ()       => request('GET',  '/zones/tree'),
  getWoredas:   (zid)    => request('GET',  `/zones/${zid}/woredas`),
  getCities:    (q)      => request('GET',  `/zones/cities${qs({ q })}`),
  createZone:   (d)      => request('POST', '/zones', d),
  updateZone:   (id, d)  => request('PUT',  `/zones/${id}`, d),
  createWoreda: (d)      => request('POST', '/zones/woredas', d),

  // ── Categories (master data) ──────────────────────────────
  getCategories: ()      => request('GET',  '/jobs/categories'),

  // ── Seeker Profile ────────────────────────────────────────
  getSeekerProfile:    ()  => request('GET',  '/applicants/profile'),
  updateSeekerProfile: (d) => request('PUT',  '/applicants/profile', d),

  // ── Announcements ─────────────────────────────────────────
  getAnnouncements:   (q)    => request('GET',    `/announcements${qs(q)}`),
  createAnnouncement: (d)    => request('POST',   '/announcements', d),
  updateAnnouncement: (id,d) => request('PUT',    `/announcements/${id}`, d),
  deleteAnnouncement: (id)   => request('DELETE', `/announcements/${id}`),

  // ── Notifications ─────────────────────────────────────────
  getNotifications: ()    => request('GET',   '/notifications'),
  markRead:         (id)  => request('PATCH', `/notifications/${id}/read`),
  markAllRead:      ()    => request('PATCH', '/notifications/read-all'),
  dismissNotif:     (id)  => request('DELETE',`/notifications/${id}`),

  // ── Dashboard ─────────────────────────────────────────────
  adminStats:  () => request('GET', '/dashboard/admin'),
  seekerStats: () => request('GET', '/dashboard/seeker'),

  // ── Admin – Users ─────────────────────────────────────────
  getUsers:      (q)     => request('GET',  `/admin/users${qs(q)}`),
  createUser:    (d)     => request('POST', '/admin/users', d),
  updateUser:    (id, d) => request('PUT',  `/admin/users/${id}`, d),
  resetPassword: (id)    => request('POST', `/admin/users/${id}/reset-password`),

  // ── Admin – Jobs ──────────────────────────────────────────
  approveJob:  (id)    => request('POST', `/admin/jobs/${id}/approve`),
  rejectJob:   (id, d) => request('POST', `/admin/jobs/${id}/reject`, d),
  getAuditLogs:()      => request('GET',  '/admin/audit-logs'),

  // ── Admin – Applications ───────────────────────────────────
  getAllApplications: (q) => request('GET', `/admin/applications${qs(q)}`),
};
