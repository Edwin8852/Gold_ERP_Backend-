const { Op } = require('sequelize');
const GoldLoan = require('../../models/goldLoan.model');
const Payment = require('../../models/payment.model');
const Customer = require('../../models/customer.model');

const generateLoanReport = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.startDate && filters.endDate) {
    where.loanDate = { [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)] };
  }

  return await GoldLoan.findAll({
    where,
    include: ['customer'],
    order: [['loanDate', 'DESC']]
  });
};

const generatePaymentReport = async (filters = {}) => {
  const where = {};
  if (filters.startDate && filters.endDate) {
    where.paymentDate = { [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)] };
  }

  return await Payment.findAll({
    where,
    order: [['paymentDate', 'DESC']]
  });
};

const generateCustomerReport = async () => {
  return await Customer.findAll({
    order: [['createdAt', 'DESC']]
  });
};

module.exports = {
  generateLoanReport,
  generatePaymentReport,
  generateCustomerReport
};
