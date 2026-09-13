const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');

router.get('/', languageController.getLanguages);

module.exports = router;
