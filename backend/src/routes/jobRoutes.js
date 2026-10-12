const router      = require('express').Router();
const jc          = require('../controllers/jobController');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const bureauAccess = require('../middleware/bureauAccess');

const staffRoles = ['super_admin','regional_admin','bureau_admin','bureau_staff','employer'];

// Static routes MUST come before /:id to avoid shadowing
router.get('/categories',          jc.getCategories);
router.get('/bureau/:bureauId',    authenticate, bureauAccess('bureauId'), jc.getBureauJobs);

router.get   ('/',          jc.getJobs);
router.post  ('/',          authenticate, authorize(...staffRoles), jc.createJob);
router.get   ('/:id',       jc.getJobById);
router.get   ('/:id/status',authenticate, jc.getApplicationStatus);
router.put   ('/:id',       authenticate, authorize(...staffRoles), jc.updateJob);
router.delete('/:id',       authenticate, authorize(...staffRoles), jc.deleteJob);

module.exports = router;
