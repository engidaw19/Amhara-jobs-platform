const router       = require('express').Router();
const lc           = require('../controllers/locationController');
const authenticate  = require('../middleware/authenticate');
const authorize     = require('../middleware/authorize');

const adminRoles = ['super_admin','regional_admin'];

router.get ('/tree',         lc.getZoneTree);
router.get ('/',             lc.getZones);
router.post('/',             authenticate, authorize(...adminRoles), lc.createZone);
router.put ('/:id',          authenticate, authorize(...adminRoles), lc.updateZone);

router.get ('/:zoneId/woredas', lc.getWoredas);
router.post('/woredas',         authenticate, authorize(...adminRoles), lc.createWoreda);

router.get ('/cities',          lc.getCities);

module.exports = router;
