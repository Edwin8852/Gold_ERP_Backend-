const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);
router.use(authorizeRoles('SUPER_ADMIN', 'ADMIN'));

/**
 * AI Risk & Analytics Routes
 */
router.post('/risk-analysis/run', aiController.runRiskAnalysis);
router.get('/risk-analysis/high-risk', aiController.getHighRiskAccounts);
router.get('/risk-analysis/customer/:id', aiController.getCustomerRisk);

module.exports = router;
