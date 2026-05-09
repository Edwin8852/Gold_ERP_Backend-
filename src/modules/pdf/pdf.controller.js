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

module.exports = {
  generateLoanPdf,
  generatePaymentPdf,
  generateLedgerPdf,
  generateJewelPdf
};
