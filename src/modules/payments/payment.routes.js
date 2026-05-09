const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', paymentController.makePayment);

module.exports = router;
