const router       = require('express').Router();
const ac           = require('../controllers/announcementController');
const authenticate  = require('../middleware/authenticate');
const authorize     = require('../middleware/authorize');

const staffRoles = ['super_admin','regional_admin','bureau_admin','bureau_staff'];

router.get   ('/',     ac.getAnnouncements);
router.post  ('/',     authenticate, authorize(...staffRoles), ac.createAnnouncement);
router.put   ('/:id',  authenticate, authorize(...staffRoles), ac.updateAnnouncement);
router.delete('/:id',  authenticate, authorize(...staffRoles), ac.deleteAnnouncement);

module.exports = router;
