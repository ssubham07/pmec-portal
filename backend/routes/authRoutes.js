const express = require('express');
const router = express.Router();
const { registerStudent, loginStudent, loginAdmin, me, getCaptcha } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.get('/captcha', getCaptcha);
router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.post('/admin/login', loginAdmin);
router.get('/me', authenticate, me);

module.exports = router;
