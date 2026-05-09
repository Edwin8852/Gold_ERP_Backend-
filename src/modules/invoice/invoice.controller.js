const invoiceService = require('./invoice.service');

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

module.exports = { getInvoices, getInvoice, getLoanInvoices };
