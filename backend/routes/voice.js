const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const voiceController = require('../controllers/voiceController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/query', auth, [
  body('query').notEmpty().withMessage('Query is required'),
  body('language').optional().isString()
], validate, voiceController.processVoiceQuery);

router.get('/history', auth, voiceController.getVoiceHistory);
router.post('/detect-language', [body('text').notEmpty()], validate, voiceController.detectLanguage);

module.exports = router;
