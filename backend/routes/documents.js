const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const documentController = require('../controllers/documentController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', auth, documentController.getDocuments);
router.get('/:id', auth, documentController.getDocument);
router.post('/', auth, [
  body('title').notEmpty(),
  body('type').notEmpty(),
  body('content').optional().isString()
], validate, documentController.createDocument);
router.put('/:id', auth, documentController.updateDocument);
router.delete('/:id', auth, documentController.deleteDocument);
router.post('/generate', auth, [
  body('documentType').notEmpty(),
  body('details').isObject()
], validate, documentController.generateDocument);

module.exports = router;
