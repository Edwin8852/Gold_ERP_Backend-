const express = require('express');
const router = express.Router();
const loanPaymentController = require('./loanPayment.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const roleMiddleware = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);

// Get all loan payments with filters (Admin only)
router.get('/', roleMiddleware('SUPER_ADMIN', 'ADMIN'), loanPaymentController.getLoanPayments);

// Process a new loan payment
router.post('/:loanId/process', roleMiddleware('SUPER_ADMIN', 'ADMIN'), loanPaymentController.processPayment);

// Manually trigger penalty checks and overdue status scans
router.post('/trigger-overdue', roleMiddleware('SUPER_ADMIN', 'ADMIN'), loanPaymentController.triggerOverdueCheck);

// Stream/Download PDF Receipt
router.get('/receipt/:paymentId', roleMiddleware('SUPER_ADMIN', 'ADMIN'), loanPaymentController.downloadReceipt);

module.exports = router;
