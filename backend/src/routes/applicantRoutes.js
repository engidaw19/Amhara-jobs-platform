const router      = require('express').Router();
const ac          = require('../controllers/applicantController');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');

router.get('/profile', authenticate, authorize('job_seeker'), ac.getProfile);
router.put('/profile', authenticate, authorize('job_seeker'), ac.updateProfile);

module.exports = router;
