const router      = require('express').Router();
const auth        = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

router.post('/register',        auth.register);
router.post('/login',           auth.login);
router.get ('/me',              authenticate, auth.me);
router.post('/change-password', authenticate, auth.changePassword);

module.exports = router;
