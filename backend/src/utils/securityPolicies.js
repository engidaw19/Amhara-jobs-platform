const PUBLIC_JOB_STATUSES = new Set(['published']);
const REVIEWER_ROLES = new Set([
  'super_admin',
  'regional_admin',
  'bureau_admin',
  'bureau_staff',
]);
const BUREAU_ROLES = new Set(['bureau_admin', 'bureau_staff']);

function isPublicJobStatus(status) {
  return PUBLIC_JOB_STATUSES.has(status);
}

function getPublicJobStatus(status) {
  return isPublicJobStatus(status) ? status : null;
}

function getJobCreationStatus(role) {
  if (role === 'bureau_admin' || role === 'super_admin' || role === 'regional_admin') {
    return 'published';
  }
  return 'pending';
}

function canReviewApplication(user, applicationBureauId) {
  if (!user || !REVIEWER_ROLES.has(user.role)) return false;
  if (!BUREAU_ROLES.has(user.role)) return true;
  return Number(user.bureau_id) === Number(applicationBureauId);
}

function canAccessBureauResource(user, requestedBureauId) {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'regional_admin') return true;
  if (!BUREAU_ROLES.has(user.role)) return false;
  return Number(user.bureau_id) === Number(requestedBureauId);
}

module.exports = {
  isPublicJobStatus,
  getPublicJobStatus,
  getJobCreationStatus,
  canReviewApplication,
  canAccessBureauResource,
};
