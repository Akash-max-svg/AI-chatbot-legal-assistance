const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');

router.get('/stats', auth, dashboardController.getDashboardStats);
router.get('/status', auth, dashboardController.getSystemStatus);
router.get('/activity', auth, dashboardController.getRecentActivity);

module.exports = router;
