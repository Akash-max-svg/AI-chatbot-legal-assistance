const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const knowledgeController = require('../controllers/knowledgeController');
const { auth, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/search', optionalAuth, knowledgeController.searchKnowledge);
router.post('/ask', auth, [body('question').notEmpty()], validate, knowledgeController.askAI);
router.get('/categories', knowledgeController.getCategories);
router.get('/acts', knowledgeController.getActs);
router.get('/acts/:id', knowledgeController.getActDetails);
router.get('/:id', optionalAuth, knowledgeController.getItem);

// Admin routes
router.post('/', auth, requireRole('Admin'), [
  body('title').notEmpty(),
  body('category').notEmpty(),
  body('content').notEmpty()
], validate, knowledgeController.createArticle);

module.exports = router;
