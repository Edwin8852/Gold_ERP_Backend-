const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

// All dashboard routes are protected
router.use(authMiddleware);
router.use(authorizeRoles('SUPER_ADMIN', 'ADMIN'));

// Dashboard Endpoints
router.get('/summary', dashboardController.getSummary);
router.get('/analytics', dashboardController.getAnalytics);
router.get('/activity', dashboardController.getActivity);
router.get('/charts', dashboardController.getCharts);
router.get('/executive-stats', dashboardController.getExecutiveStats);
router.get('/security-logs', dashboardController.getSecurityLogs);

module.exports = router;
