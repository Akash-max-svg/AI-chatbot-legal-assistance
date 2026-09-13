const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseFilingController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, caseController.getCases);
router.get('/:id', auth, caseController.getCase);
router.put('/:id', auth, caseController.updateCase);
router.delete('/:id', auth, caseController.deleteCase);

module.exports = router;
