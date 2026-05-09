const Invoice = require('../../models/invoice.model');

const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const createInvoice = async (invoiceData) => {
  const invoice = await Invoice.create({
    ...invoiceData,
    invoiceNumber: generateInvoiceNumber()
  });
  return invoice;
};

const getAllInvoices = async () => {
  return await Invoice.findAll({ order: [['createdAt', 'DESC']] });
};

const getInvoiceById = async (id) => {
  return await Invoice.findByPk(id);
};

const getInvoicesByLoanId = async (loanId) => {
  return await Invoice.findAll({ where: { loanId }, order: [['createdAt', 'DESC']] });
};

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoicesByLoanId
};
