const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { auth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

// User routes
router.get('/me', auth, userController.getProfile);
router.put('/me', auth, [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('preferences').optional().isObject()
], validate, userController.updateProfile);
router.delete('/me', auth, userController.deleteProfile);
router.get('/me/stats', auth, userController.getUserStats);

// Admin routes
router.get('/', auth, requireRole('Admin'), userController.getUsers);
router.get('/:id', auth, requireRole('Admin'), userController.getUser);
router.put('/:id/role', auth, requireRole('Admin'), [
  body('role').isIn(['Citizen', 'Lawyer', 'Judge', 'Admin'])
], validate, userController.updateUserRole);
router.delete('/:id', auth, requireRole('Admin'), userController.deactivateUser);
router.get('/:id/stats', auth, userController.getUserStats);

module.exports = router;
