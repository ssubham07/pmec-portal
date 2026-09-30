const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');
const {
  createRequest,
  listMyRequests,
  getRequestDetail,
  downloadCertificate,
  getNotifications,
} = require('../controllers/requestController');

// All routes here require a logged-in user; role checks are per-route.
router.use(authenticate);

router.post('/', requireRole('student'), uploadDocument.array('documents', 5), createRequest);
router.get('/mine', requireRole('student'), listMyRequests);
router.get('/notifications', requireRole('student'), getNotifications);
router.get('/notifications/unread', requireRole('student'), getNotifications);
router.get('/:id', requireRole('student', 'admin'), getRequestDetail);
router.get('/:id/certificate', requireRole('student', 'admin'), downloadCertificate);

module.exports = router;
