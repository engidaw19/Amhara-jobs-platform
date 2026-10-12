const router       = require('express').Router();
const nc           = require('../controllers/notificationController');
const authenticate  = require('../middleware/authenticate');

router.get   ('/',            authenticate, nc.getNotifications);
router.patch ('/read-all',    authenticate, nc.markAllRead);
router.patch ('/:id/read',    authenticate, nc.markRead);
router.delete('/:id',         authenticate, nc.dismiss);

module.exports = router;
