const express = require('express');
const router = express.Router();
const pdfController = require('./pdf.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);

// Restrict these to users/admins as needed. Usually user can see own, but for simplicity admins manage here.
router.get('/loan/:loanId', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), pdfController.generateLoanPdf);
router.get('/payment/:paymentId', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), pdfController.generatePaymentPdf);
router.get('/ledger/:loanId', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), pdfController.generateLedgerPdf);
router.get('/jewel/:inspectionId', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), pdfController.generateJewelPdf);

module.exports = router;
