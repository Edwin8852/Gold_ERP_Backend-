const express = require('express');
const router = express.Router();
const chitPaymentController = require('./chitPayment.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const roleMiddleware = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);

// Get all chit payments with filters (Admin only)
router.get('/', roleMiddleware('SUPER_ADMIN', 'ADMIN'), chitPaymentController.getChitPayments);

// Process a new chit payment
router.post('/:subscriberId/process', roleMiddleware('SUPER_ADMIN', 'ADMIN'), chitPaymentController.processPayment);

module.exports = router;
