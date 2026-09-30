const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginStudent,
  verifyStudentOtp,
  resendStudentOtp,
  loginAdmin,
  verifyAdminOtp,
  resendAdminOtp,
  me,
  getCaptcha,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.get('/captcha', getCaptcha);
router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.post('/student/verify-otp', verifyStudentOtp);
router.post('/student/resend-otp', resendStudentOtp);
router.post('/admin/login', loginAdmin);
router.post('/admin/verify-otp', verifyAdminOtp);
router.post('/admin/resend-otp', resendAdminOtp);
router.get('/me', authenticate, me);

module.exports = router;
