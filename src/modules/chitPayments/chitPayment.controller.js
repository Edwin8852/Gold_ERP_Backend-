const chitPaymentService = require('./chitPayment.service');
const AppError = require('../../shared/utils/AppError');

exports.processPayment = async (req, res, next) => {
  try {
    const { subscriberId } = req.params;
    const paymentData = req.body;
    const userId = req.user.id;

    if (!subscriberId || !paymentData.amountPaid || !paymentData.paymentType) {
      throw new AppError('Missing required chit payment fields', 400);
    }

    const payment = await chitPaymentService.processPayment(subscriberId, paymentData, userId);

    res.status(201).json({
      success: true,
      message: 'Chit payment processed successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

exports.getChitPayments = async (req, res, next) => {
  try {
    const filters = req.query;
    const payments = await chitPaymentService.getChitPayments(filters);

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};
