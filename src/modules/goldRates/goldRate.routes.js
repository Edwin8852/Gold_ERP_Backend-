const express = require('express');
const router = express.Router();
const goldRateController = require('./goldRate.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

// Publicly accessible for the ticker, or protected if preferred
router.get('/latest', goldRateController.getLatestRate);
router.get('/live', goldRateController.getLiveRate);

module.exports = router;
