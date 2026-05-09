const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);

router.get('/loans', authorizeRoles('SUPER_ADMIN', 'ADMIN'), reportsController.getLoanReport);
router.get('/payments', authorizeRoles('SUPER_ADMIN', 'ADMIN'), reportsController.getPaymentReport);
router.get('/customers', authorizeRoles('SUPER_ADMIN', 'ADMIN'), reportsController.getCustomerReport);

module.exports = router;
