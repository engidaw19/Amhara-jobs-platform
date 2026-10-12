const router       = require('express').Router();
const ac           = require('../controllers/applicationController');
const authenticate  = require('../middleware/authenticate');
const authorize     = require('../middleware/authorize');
const bureauAccess = require('../middleware/bureauAccess');

const reviewerRoles = ['super_admin', 'regional_admin', 'bureau_admin', 'bureau_staff'];

router.post('/:id/apply', authenticate, authorize('job_seeker'), ac.apply);
router.get  ('/my',                       authenticate, authorize('job_seeker'), ac.getMyApplications);
router.get  ('/bureau/:bureauId',         authenticate, authorize(...reviewerRoles), bureauAccess('bureauId'), ac.getBureauApplications);
router.patch('/:id/status',              authenticate, authorize(...reviewerRoles), ac.updateStatus);

module.exports = router;
