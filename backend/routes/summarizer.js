const express = require('express');
const router = express.Router();
const summarizerController = require('../controllers/summarizerController');
const { auth } = require('../middleware/auth');
const { handleUpload, uploadSingle } = require('../middleware/upload');

router.post('/', auth, handleUpload(uploadSingle), summarizerController.summarizeDocument);
router.get('/', auth, summarizerController.getSummaries);
router.get('/:id', auth, summarizerController.getSummary);
router.delete('/:id', auth, summarizerController.deleteSummary);

module.exports = router;
