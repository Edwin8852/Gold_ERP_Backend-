const invoiceService = require('./invoice.service');
const pdfService = require('../../shared/utils/pdf.service');
const { GoldLoan, Customer, Payment, LoanPayment } = require('../../models');

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
      payment = await LoanPayment.findByPk(invoice.paymentId);
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
    const { Invoice, LoanPayment, Payment, GoldLoan, Customer } = require('../../models');
    let invoice = await Invoice.findOne({ where: { invoiceNumber: req.params.invoiceNumber } });
    
    let payment = null;
    if (!invoice) {
      // Check if it's a legacy payment that has an invoiceNumber but no Invoice row
      payment = await LoanPayment.findOne({ where: { invoiceNumber: req.params.invoiceNumber } });
      
      // Also check the Customer Payments table (`Payment`)
      if (!payment && Payment) {
         payment = await Payment.findOne({ where: { invoiceNumber: req.params.invoiceNumber } });
      }

      if (payment) {
        invoice = {
          invoiceNumber: payment.invoiceNumber,
          invoiceType: 'PAYMENT_RECEIPT',
          loanId: payment.loanId,
          paymentId: payment.id,
          oldBalance: payment.principalPaid ? payment.principalPaid + (payment.remainingPrincipal || 0) : 0,
          paidAmount: payment.paymentAmount,
          remainingBalance: payment.remainingPrincipal || 0,
          interestAmount: payment.interestPaid || 0,
          pendingAmount: 0,
          totalPaid: payment.paymentAmount,
          generatedDate: payment.paymentDate || payment.createdAt
        };
      } else {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
    }

    const loan = await GoldLoan.findByPk(invoice.loanId);
    const customer = await Customer.findByPk(loan.customerId);

    if (invoice.paymentId && !payment) {
      payment = await LoanPayment.findByPk(invoice.paymentId);
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

