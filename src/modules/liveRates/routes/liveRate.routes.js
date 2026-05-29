const express = require('express');
const router = express.Router();
const liveRateController = require('../controller/liveRate.controller');
const authMiddleware = require('../../../shared/middleware/auth.middleware');

// Public route for ticker and dashboards
router.get('/', liveRateController.getLiveRates);

// Protected route for force refreshing
router.post('/refresh', authMiddleware, liveRateController.refreshRates);

module.exports = router;
