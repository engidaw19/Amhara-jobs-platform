const router       = require('express').Router();
const dc           = require('../controllers/dashboardController');
const authenticate  = require('../middleware/authenticate');
const authorize     = require('../middleware/authorize');

router.get('/admin',  authenticate, authorize('super_admin','regional_admin'), dc.getAdminStats);
router.get('/seeker', authenticate, authorize('job_seeker'),                   dc.getSeekerStats);

module.exports = router;
