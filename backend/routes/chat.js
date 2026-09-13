const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

router.post('/send', auth, chatLimiter, [
  body('message').notEmpty().withMessage('Message is required'),
  body('language').optional().isString(),
  body('sessionId').optional().isMongoId()
], validate, chatController.sendMessage);

router.get('/sessions', auth, chatController.getSessions);
router.get('/sessions/:sessionId/messages', auth, chatController.getSessionMessages);
router.delete('/sessions/:sessionId', auth, chatController.deleteSession);
router.post('/messages/:messageId/rate', auth, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString()
], validate, chatController.rateMessage);

module.exports = router;
