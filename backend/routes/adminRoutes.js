const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadSignature } = require('../middleware/upload');
const {
  listQueue,
  actOnRequest,
  getAuditLog,
  uploadSignature: uploadSignatureCtrl,
  saveDrawnSignature,
  listPendingStudents,
  verifyStudent,
  rejectStudent,
} = require('../controllers/adminController');

router.use(authenticate, requireRole('admin'));

router.get('/requests', listQueue);
router.post('/requests/:id/action', actOnRequest);
router.get('/requests/:id/audit-log', getAuditLog);

// Student verification routes
router.get('/students/pending', listPendingStudents);
router.post('/students/:id/verify', verifyStudent);
router.post('/students/:id/reject', rejectStudent);

// e-signature setup: either upload a scanned/photographed signature image,
// or POST a base64 PNG captured from a signature-pad <canvas> on the frontend.
router.post('/signature/upload', uploadSignature.single('signature'), uploadSignatureCtrl);
router.post('/signature/draw', saveDrawnSignature);

module.exports = router;
