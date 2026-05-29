const pdfService = require('./pdf.service');

const generateLoanPdf = async (req, res) => {
  try {
    const url = await pdfService.generateLoanInvoicePDF(req.params.loanId);
    return res.status(200).json({ success: true, message: 'PDF generated successfully', data: { pdfUrl: url } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const generatePaymentPdf = async (req, res) => {
  try {
    const url = await pdfService.generatePaymentReceiptPDF(req.params.paymentId);
    return res.status(200).json({ success: true, message: 'PDF generated successfully', data: { pdfUrl: url } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const generateLedgerPdf = async (req, res) => {
  try {
    const url = await pdfService.generateLoanLedgerPDF(req.params.loanId);
    return res.status(200).json({ success: true, message: 'PDF generated successfully', data: { pdfUrl: url } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const generateJewelPdf = async (req, res) => {
  try {
    const url = await pdfService.generateJewelInspectionPDF(req.params.inspectionId);
    return res.status(200).json({ success: true, message: 'PDF generated successfully', data: { pdfUrl: url } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const generateChitInvoicePdf = async (req, res) => {
  try {
    const { ChitFundPayment } = require('../../models');
    let paymentId = req.params.paymentId;
    
    // If paymentId is not a UUID, it might be the transactionId (referenceNumber)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId)) {
      const payment = await ChitFundPayment.findOne({ where: { referenceNumber: paymentId } });
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Chit payment record not found for the given transaction ID' });
      }
      paymentId = payment.id;
    }

    const url = await pdfService.generateChitInvoicePDF(paymentId);
    return res.status(200).json({ success: true, message: 'PDF generated successfully', data: { pdfUrl: url } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateLoanPdf,
  generatePaymentPdf,
  generateLedgerPdf,
  generateJewelPdf,
  generateChitInvoicePdf
};
