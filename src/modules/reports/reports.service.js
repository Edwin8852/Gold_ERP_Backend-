const { Op, fn, col, literal } = require('sequelize');
const { GoldLoan, Payment, Customer, Ledger } = require('../../models');
const { sequelize } = require('../../config/db.config');

const generateRevenueReport = async (filters = {}) => {
  const { startDate, endDate } = filters;
  const whereClause = {};
  if (startDate && endDate) {
    whereClause.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  }

  // 1. Revenue Summary
  const totalRevenue = await Payment.sum('paymentAmount', { where: whereClause }) || 0;
  const totalPaymentsReceived = await Payment.count({ where: whereClause });
  
  const totalActiveLoans = await GoldLoan.count({ where: { status: 'ACTIVE' } });
  const totalLoanAmount = await GoldLoan.sum('loanAmount') || 0;
  const totalPendingAmount = await GoldLoan.sum('remainingPrincipal') || 0;
  const totalCustomers = await Customer.count();

  // 2. Periodic Revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRevenue = await Payment.sum('paymentAmount', {
    where: { createdAt: { [Op.gte]: today } }
  }) || 0;

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyRevenue = await Payment.sum('paymentAmount', {
    where: { createdAt: { [Op.gte]: startOfMonth } }
  }) || 0;

  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const yearlyRevenue = await Payment.sum('paymentAmount', {
    where: { createdAt: { [Op.gte]: startOfYear } }
  }) || 0;

  // 3. Revenue Breakdown by Payment Method
  const breakdown = await Payment.findAll({
    attributes: [
      'paymentMethod',
      [fn('SUM', col('paymentAmount')), 'total']
    ],
    where: whereClause,
    group: ['paymentMethod']
  });

  const paymentBreakdown = {
    CASH: 0,
    UPI: 0,
    BANK_TRANSFER: 0
  };
  breakdown.forEach(item => {
    paymentBreakdown[item.paymentMethod] = parseFloat(item.get('total')) || 0;
  });

  // 4. Loan Analytics
  const loanStats = await GoldLoan.findAll({
    attributes: [
      'status',
      [fn('COUNT', col('id')), 'count']
    ],
    group: ['status']
  });

  const loanAnalytics = {
    ACTIVE: 0,
    CLOSED: 0,
    OVERDUE: 0,
    PENDING: 0
  };
  loanStats.forEach(item => {
    loanAnalytics[item.status] = parseInt(item.get('count')) || 0;
  });

  // 5. Dashboard Analytics - Growth (Monthly)
  const monthlyGrowth = await GoldLoan.findAll({
    attributes: [
      [fn('DATE_TRUNC', 'month', col('createdAt')), 'month'],
      [fn('COUNT', col('id')), 'count']
    ],
    group: [fn('DATE_TRUNC', 'month', col('createdAt'))],
    order: [[fn('DATE_TRUNC', 'month', col('createdAt')), 'DESC']],
    limit: 6
  });

  const paymentGrowth = await Payment.findAll({
    attributes: [
      [fn('DATE_TRUNC', 'month', col('createdAt')), 'month'],
      [fn('SUM', col('paymentAmount')), 'total']
    ],
    group: [fn('DATE_TRUNC', 'month', col('createdAt'))],
    order: [[fn('DATE_TRUNC', 'month', col('createdAt')), 'DESC']],
    limit: 6
  });

  // Recent Transactions (Recent Ledger Entries)
  const recentTransactions = await Ledger.findAll({
    limit: 10,
    order: [['createdAt', 'DESC']],
    include: [
      { model: Customer, as: 'customer', attributes: ['firstName', 'lastName'] },
      { model: GoldLoan, as: 'loan', attributes: ['id'] }
    ]
  });

  return {
    summary: {
      totalRevenue,
      totalPaymentsReceived,
      totalActiveLoans,
      totalLoanAmount,
      totalPendingAmount,
      totalCustomers,
      todayRevenue,
      monthlyRevenue,
      yearlyRevenue
    },
    paymentBreakdown,
    loanAnalytics,
    growth: {
      monthlyLoanGrowth: monthlyGrowth,
      paymentGrowth: paymentGrowth
    },
    recentTransactions
  };
};

const generateLoanReport = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.startDate && filters.endDate) {
    where.loanDate = { [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)] };
  }

  return await GoldLoan.findAll({
    where,
    include: [{ model: Customer, as: 'customer' }],
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
  generateRevenueReport,
  generateLoanReport,
  generatePaymentReport,
  generateCustomerReport
};
