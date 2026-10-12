const router       = require('express').Router();
const ac           = require('../controllers/adminController');
const authenticate  = require('../middleware/authenticate');
const authorize     = require('../middleware/authorize');

const adminOnly = [authenticate, authorize('super_admin','regional_admin')];

router.get   ('/users',                   ...adminOnly, ac.getUsers);
router.post  ('/users',                   ...adminOnly, ac.createUser);
router.put   ('/users/:id',               ...adminOnly, ac.updateUser);
router.post  ('/users/:id/reset-password',...adminOnly, ac.resetUserPassword);
router.post  ('/jobs/:id/approve',        ...adminOnly, ac.approveJob);
router.post  ('/jobs/:id/reject',         ...adminOnly, ac.rejectJob);
router.get   ('/applications',            ...adminOnly, ac.getAllApplications);
router.get   ('/audit-logs',              ...adminOnly, ac.getAuditLogs);

module.exports = router;
