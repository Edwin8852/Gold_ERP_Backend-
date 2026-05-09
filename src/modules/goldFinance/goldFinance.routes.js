const express = require('express');
const router = express.Router();
const goldFinanceController = require('./goldFinance.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

// All routes are protected by JWT
router.use(authMiddleware);

router.post('/', authorizeRoles('SUPER_ADMIN', 'ADMIN'), goldFinanceController.createLoan);
router.get('/', goldFinanceController.getLoans);
router.get('/:id', goldFinanceController.getLoan);
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN'), goldFinanceController.updateLoan);
router.patch('/:id/close', authorizeRoles('SUPER_ADMIN', 'ADMIN'), goldFinanceController.closeLoan);
router.delete('/:id', authorizeRoles('SUPER_ADMIN'), goldFinanceController.deleteLoan);

module.exports = router;
