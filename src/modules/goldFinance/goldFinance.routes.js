const express = require('express');
const router = express.Router();
const goldFinanceController = require('./goldFinance.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

// All routes are protected by JWT
router.use(authMiddleware);

// Admin Routes
router.post('/', authorizeRoles('SUPER_ADMIN', 'ADMIN'), goldFinanceController.create);
router.get('/', authorizeRoles('SUPER_ADMIN', 'ADMIN'), goldFinanceController.getAll);
router.get('/pending', authorizeRoles('SUPER_ADMIN', 'ADMIN'), goldFinanceController.getPendingLoans);
router.put('/:id/approve', authorizeRoles('SUPER_ADMIN', 'ADMIN'), goldFinanceController.approveLoan);
router.patch('/:id/pre-approve', authorizeRoles('SUPER_ADMIN', 'ADMIN'), goldFinanceController.preApproveLoan);
router.patch('/:id/reject', authorizeRoles('SUPER_ADMIN', 'ADMIN'), goldFinanceController.rejectLoan);
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN'), goldFinanceController.update);
router.patch('/:id/close', authorizeRoles('SUPER_ADMIN', 'ADMIN'), goldFinanceController.close);
router.delete('/:id', authorizeRoles('SUPER_ADMIN'), goldFinanceController.delete);

// Customer Routes
router.get('/my-loans', authorizeRoles('CUSTOMER'), goldFinanceController.getMyLoans);
router.post('/apply', authorizeRoles('CUSTOMER'), goldFinanceController.requestLoan);

// Common / Specific Route
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'CUSTOMER'), goldFinanceController.getById);
router.get('/:id/history', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'CUSTOMER'), goldFinanceController.getLoanHistory);

router.post('/overdue-scan', authorizeRoles('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { GoldLoanService } = require('../goldLoan/goldLoan.service'); // circular dep check
    const count = await require('../goldLoan/goldLoan.service').updateOverdueLoans();
    res.json({ success: true, message: `Scan complete. ${count} loans moved to OVERDUE.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
