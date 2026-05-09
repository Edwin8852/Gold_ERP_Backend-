const paymentService = require('./payment.service');

const makePayment = async (req, res) => {
  try {
    const result = await paymentService.processPayment(req.body, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Payment processed and invoice generated successfully',
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { makePayment };
