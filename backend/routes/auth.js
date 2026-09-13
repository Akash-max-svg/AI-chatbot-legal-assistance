const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['Citizen', 'Lawyer', 'Judge']).withMessage('Invalid role'),
  body('phone').optional().trim()
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// Routes
router.post('/register', authLimiter, registerValidation, validate, authController.register);
router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.post('/logout', auth, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authLimiter, [body('email').isEmail()], validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, validate, authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/change-password', auth, changePasswordValidation, validate, authController.changePassword);
router.get('/me', auth, authController.getMe);

module.exports = router;
