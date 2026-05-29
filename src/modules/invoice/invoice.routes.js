const express = require('express');
const router = express.Router();
const invoiceController = require('./invoice.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoice);
router.get('/:id/download', invoiceController.downloadPDF);
router.get('/download-by-number/:invoiceNumber', invoiceController.downloadPDFByNumber);
router.get('/loan/:loanId', invoiceController.getLoanInvoices);

module.exports = router;
