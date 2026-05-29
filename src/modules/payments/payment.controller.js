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

const getAllPayments = async (req, res) => {
  try {
    const payments = await paymentService.getAllPayments(req.query);
    return res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getLoanPayments = async (req, res) => {
  try {
    const { loanId } = req.params;
    console.log(`[PaymentController] Fetching payments for Loan ID: ${loanId}`);
    
    const payments = await paymentService.getLoanPayments(loanId);
    
    console.log(`[PaymentController] Successfully fetched ${payments.length} payments`);
    return res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('[PaymentController] FETCH ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = { makePayment, getAllPayments, getLoanPayments };

