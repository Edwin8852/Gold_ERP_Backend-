const express = require('express');
const router = express.Router();
const goldLoanController = require('./goldLoan.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);

// Customer Routes
router.post('/apply', authorizeRoles('CUSTOMER'), goldLoanController.apply);
router.get('/my-loans', authorizeRoles('CUSTOMER'), goldLoanController.getMyLoans);
router.post('/:id/pay', authorizeRoles('CUSTOMER'), goldLoanController.pay);
router.get('/ledger/global', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'), goldLoanController.getGlobalLedger);

// Admin Routes
router.get('/all', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), goldLoanController.getAll);
router.get('/pending', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), goldLoanController.getPending);
router.patch('/:id/approve', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), goldLoanController.approve);
router.patch('/:id/reject', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), goldLoanController.reject);
router.post('/:id/close', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), goldLoanController.close);
router.post('/:id/release-ornament', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), goldLoanController.releaseOrnament);
router.get('/:id/ledger', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'), goldLoanController.getLedger);
router.get('/:id/details', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'), goldLoanController.getDetails);

module.exports = router;
