const router = require('express').Router();

router.use('/auth',          require('./authRoutes'));
router.use('/jobs',          require('./jobRoutes'));
router.use('/applications',  require('./applicationRoutes'));
router.use('/documents',     require('./documentRoutes'));
router.use('/applicants',    require('./applicantRoutes'));
router.use('/bureaus',       require('./bureauRoutes'));
router.use('/zones',         require('./locationRoutes'));
router.use('/announcements', require('./announcementRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/dashboard',     require('./dashboardRoutes'));
router.use('/admin',         require('./adminRoutes'));

module.exports = router;
