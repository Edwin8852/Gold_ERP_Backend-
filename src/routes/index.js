const express = require('express');
const router = express.Router();
const authRoutes = require('../modules/auth/auth.routes');
const goldFinanceRoutes = require('../modules/goldFinance/goldFinance.routes');
const invoiceRoutes = require('../modules/invoice/invoice.routes');
const paymentRoutes = require('../modules/payments/payment.routes');
const customerRoutes = require('../modules/customer/customer.routes');
const jewelInspectionRoutes = require('../modules/jewelInspection/jewelInspection.routes');
const goldRateRoutes = require('../modules/goldRates/goldRate.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const reportRoutes = require('../modules/reports/reports.routes');
const chitFundRoutes = require('../modules/chitFund/chitFund.routes');
const pdfRoutes = require('../modules/pdf/pdf.routes');

router.use('/auth', authRoutes);
router.use('/gold-finance', goldFinanceRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/customers', customerRoutes);
router.use('/jewel-inspection', jewelInspectionRoutes);
router.use('/gold-rates', goldRateRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/chit-fund', chitFundRoutes);
router.use('/pdf', pdfRoutes);

module.exports = router;
