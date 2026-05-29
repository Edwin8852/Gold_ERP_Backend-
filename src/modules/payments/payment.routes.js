const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', paymentController.getAllPayments);
router.get('/:loanId', paymentController.getLoanPayments);
router.post('/', paymentController.makePayment);


module.exports = router;
