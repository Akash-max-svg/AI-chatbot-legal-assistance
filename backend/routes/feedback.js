const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const feedbackController = require('../controllers/feedbackController');
const { auth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/', auth, [
  body('subject').notEmpty(),
  body('message').notEmpty(),
  body('type').optional().isIn(['general', 'bug', 'feature-request', 'complaint', 'suggestion', 'other']),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('category').optional().isIn(['chatbot', 'voice-assistant', 'document-summarizer', 'case-filing', 'knowledge-base', 'general', 'other'])
], validate, feedbackController.submitFeedback);

router.get('/', auth, requireRole('Admin'), feedbackController.getFeedback);
router.get('/me', auth, feedbackController.getMyFeedback);
router.put('/:id', auth, requireRole('Admin'), [
  body('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed']),
  body('response').optional().isString()
], validate, feedbackController.updateFeedbackStatus);

module.exports = router;
