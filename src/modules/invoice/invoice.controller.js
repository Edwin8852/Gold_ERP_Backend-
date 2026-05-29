const invoiceService = require('./invoice.service');
const pdfService = require('../../shared/utils/pdf.service');
const { GoldLoan, Customer, Payment } = require('../../models');

const getInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.getAllInvoices();
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getLoanInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.getInvoicesByLoanId(req.params.loanId);
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const loan = await GoldLoan.findByPk(invoice.loanId);
    const customer = await Customer.findByPk(loan.customerId);

    let payment = null;
    if (invoice.paymentId) {
      payment = await Payment.findByPk(invoice.paymentId);
    }

    const pdfBuffer = await pdfService.generateLoanInvoice(invoice, loan, customer, payment);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};

const downloadPDFByNumber = async (req, res) => {
  try {
    const { Invoice } = require('../../models');
    const invoice = await Invoice.findOne({ where: { invoiceNumber: req.params.invoiceNumber } });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const loan = await GoldLoan.findByPk(invoice.loanId);
    const customer = await Customer.findByPk(loan.customerId);

    let payment = null;
    if (invoice.paymentId) {
      payment = await Payment.findByPk(invoice.paymentId);
    }

    const pdfBuffer = await pdfService.generateLoanInvoice(invoice, loan, customer, payment);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};

module.exports = { getInvoices, getInvoice, getLoanInvoices, downloadPDF, downloadPDFByNumber };

