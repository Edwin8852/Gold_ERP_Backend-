const loanPaymentService = require('./loanPayment.service');
const AppError = require('../../shared/utils/AppError');
const path = require('path');
const fs = require('fs');

exports.processPayment = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const paymentData = req.body;
    const userId = req.user.id;

    if (!loanId || !paymentData.amountPaid || !paymentData.paymentType) {
      throw new AppError('Missing required payment fields: loanId, amountPaid, and paymentType are mandatory.', 400);
    }

    const payment = await loanPaymentService.processPayment(loanId, paymentData, userId);

    res.status(201).json({
      success: true,
      message: 'Loan payment processed successfully',
      data: payment
    });
  } catch (error) {
    console.error('[LoanPaymentController] API Error in processPayment:', error);
    next(error);
  }
};

exports.getLoanPayments = async (req, res, next) => {
  try {
    const filters = req.query;
    const payments = await loanPaymentService.getLoanPayments(filters);

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('[LoanPaymentController] API Error in getLoanPayments:', error);
    next(error);
  }
};

/**
 * Handle manual execution of overdue loan scans and penalty applications.
 */
exports.triggerOverdueCheck = async (req, res, next) => {
  try {
    const penaltyCalculationService = require('./penaltyCalculation.service');
    const updatedCount = await penaltyCalculationService.processOverdueLoans();
    res.status(200).json({
      success: true,
      message: `Daily overdue scanning complete. Updated ${updatedCount} loans to OVERDUE or updated outstanding penalty amounts.`,
      updatedCount
    });
  } catch (error) {
    console.error('[LoanPaymentController] API Error in triggerOverdueCheck:', error);
    next(error);
  }
};

/**
 * Stream/Download printable payment receipt PDF
 */
exports.downloadReceipt = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { LoanReceipt } = require('../../models');

    let receipt = await LoanReceipt.findOne({ where: { loanPaymentId: paymentId } });
    if (!receipt) {
      // If it doesn't exist, try to generate it now
      const receiptService = require('./receipt.service');
      receipt = await receiptService.generateReceiptPDF(paymentId, req.user.id);
    }

    const filepath = path.join(__dirname, '../../../uploads/pdfs', `loan-receipt-${paymentId}.pdf`);
    if (!fs.existsSync(filepath)) {
      // Regenerate PDF if file missing on disk
      const receiptService = require('./receipt.service');
      await receiptService.generateReceiptPDF(paymentId, req.user.id);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt-${receipt.receiptNumber}.pdf`);
    return res.sendFile(filepath);
  } catch (error) {
    console.error('[LoanPaymentController] API Error in downloadReceipt:', error);
    next(error);
  }
};
