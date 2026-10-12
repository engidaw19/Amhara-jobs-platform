const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');
const controller = require('../controllers/documentController');

router.use(authenticate, authorize('job_seeker'));

router.post('/cv', uploadMiddleware('CV'), controller.uploadDocument);
router.post('/grade8', uploadMiddleware('GRADE_8'), controller.uploadDocument);
router.post('/grade12', uploadMiddleware('GRADE_12'), controller.uploadDocument);
router.post('/degree', uploadMiddleware('DEGREE'), controller.uploadDocument);
router.get('/my-documents', controller.getMyDocuments);
router.get('/:documentId', controller.viewDocument);
router.delete('/:documentId', controller.deleteDocument);

module.exports = router;
