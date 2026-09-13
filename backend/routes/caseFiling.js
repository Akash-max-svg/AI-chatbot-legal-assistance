const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const caseFilingController = require('../controllers/caseFilingController');
const { auth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

// AI analysis
router.post('/analyze', auth, [
  body('scenario').notEmpty().withMessage('Scenario is required'),
  body('category').optional().isString(),
  body('language').optional().isString()
], validate, caseFilingController.analyzeCase);

// CRUD operations
router.get('/', auth, caseFilingController.getCases);
router.get('/:id', auth, caseFilingController.getCase);
router.post('/', auth, [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('category').notEmpty()
], validate, caseFilingController.createCase);
router.put('/:id', auth, caseFilingController.updateCase);
router.post('/:id/hearings', auth, requireRole('Judge', 'Admin'), [
  body('date').isISO8601(),
  body('notes').optional().isString()
], validate, caseFilingController.addHearing);
router.delete('/:id', auth, caseFilingController.deleteCase);

module.exports = router;
