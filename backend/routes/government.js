const express = require('express');
const router = express.Router();
const governmentController = require('../controllers/governmentController');
const { optionalAuth } = require('../middleware/auth');

router.get('/judgements/latest', optionalAuth, governmentController.getLatestJudgements);
router.get('/judgements/search', optionalAuth, governmentController.searchJudgements);
router.get('/acts', optionalAuth, governmentController.getActsAndRules);
router.get('/acts/:id', optionalAuth, governmentController.getAct);
router.get('/notices', optionalAuth, governmentController.getNoticeBoard);
router.get('/faqs', optionalAuth, governmentController.getLegalFAQs);

module.exports = router;
