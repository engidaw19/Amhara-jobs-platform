const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getPublicJobStatus,
  getJobCreationStatus,
  canReviewApplication,
  canAccessBureauResource,
} = require('../src/utils/securityPolicies');

test('public job queries are restricted to published vacancies', () => {
  assert.equal(getPublicJobStatus('published'), 'published');
  assert.equal(getPublicJobStatus('pending'), null);
  assert.equal(getPublicJobStatus('draft'), null);
  assert.equal(getPublicJobStatus(undefined), null);
});

test('bureau admins publish new jobs immediately while other submitters follow approval', () => {
  assert.equal(getJobCreationStatus('bureau_admin'), 'published');
  assert.equal(getJobCreationStatus('bureau_staff'), 'pending');
  assert.equal(getJobCreationStatus('super_admin'), 'published');
  assert.equal(getJobCreationStatus('regional_admin'), 'published');
  assert.equal(getJobCreationStatus('employer'), 'pending');
});

test('only authorized reviewers can change application status', () => {
  assert.equal(canReviewApplication({ role: 'bureau_admin', bureau_id: 1 }, 1), true);
  assert.equal(canReviewApplication({ role: 'job_seeker', bureau_id: 1 }, 1), false);
  assert.equal(canReviewApplication({ role: 'regional_admin' }, 1), true);
});

test('bureau users cannot access another bureau resource', () => {
  assert.equal(canAccessBureauResource({ role: 'bureau_admin', bureau_id: 1 }, 2), false);
  assert.equal(canAccessBureauResource({ role: 'super_admin', bureau_id: 1 }, 2), true);
  assert.equal(canAccessBureauResource({ role: 'bureau_admin', bureau_id: 1 }, 1), true);
});
