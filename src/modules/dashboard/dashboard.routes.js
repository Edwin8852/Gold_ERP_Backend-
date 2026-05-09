const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);

router.get('/admin', authorizeRoles('SUPER_ADMIN', 'ADMIN'), dashboardController.getAdminDashboard);
router.get('/revenue', authorizeRoles('SUPER_ADMIN', 'ADMIN'), dashboardController.getRevenue);
router.get('/overdue-loans', authorizeRoles('SUPER_ADMIN', 'ADMIN'), dashboardController.getOverdueLoans);

module.exports = router;
