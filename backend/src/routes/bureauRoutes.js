const router       = require('express').Router();
const bc           = require('../controllers/bureauController');
const authenticate  = require('../middleware/authenticate');
const authorize     = require('../middleware/authorize');

const adminRoles = ['super_admin','regional_admin'];

router.get ('/',          bc.getBureaus);
router.get ('/:id',       bc.getBureauById);
router.get ('/:id/stats', authenticate, bc.getBureauStats);
router.post('/',          authenticate, authorize(...adminRoles), bc.createBureau);
router.put ('/:id',       authenticate, authorize(...adminRoles), bc.updateBureau);

module.exports = router;
