const Customer = require('../../models/customer.model');
const GoldLoan = require('../../models/goldLoan.model');
const Payment = require('../../models/payment.model');
const ChitMember = require('../../models/chitMember.model');
const ChitPayment = require('../../models/chitPayment.model');

const getAdminSummary = async () => {
  const [
    totalCustomers,
    loanStats,
    totalRevenue,
    todayCollection,
    goldUnderCustody
  ] = await Promise.all([
    Customer.count(),
    GoldLoan.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('remainingPrincipal')), 'pendingPrincipal'],
        [fn('SUM', col('totalPaid')), 'totalPaid']
      ],
      group: ['status'],
      raw: true
    }),
    Payment.sum('paymentAmount'), // Simplification: assuming interest is part of payment
    Payment.sum('paymentAmount', {
      where: {
        paymentDate: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    GoldLoan.sum('goldWeight', { where: { status: 'ACTIVE' } }),
    ChitMember.count({ where: { memberStatus: 'INACTIVE' } }),
    ChitPayment.count({ where: { paymentStatus: 'MISSED' } })
  ]);

  // Process loanStats array to object
  const stats = {
    totalLoans: 0,
    activeLoans: 0,
    closedLoans: 0,
    overdueLoans: 0,
    totalPendingAmount: 0,
  };

  loanStats.forEach(stat => {
    const count = parseInt(stat.count);
    stats.totalLoans += count;
    if (stat.status === 'ACTIVE') stats.activeLoans = count;
    if (stat.status === 'CLOSED') stats.closedLoans = count;
    if (stat.status === 'OVERDUE') stats.overdueLoans = count;
    stats.totalPendingAmount += parseFloat(stat.pendingPrincipal || 0);
  });

  return {
    totalCustomers,
    ...stats,
    totalRevenue: totalRevenue || 0,
    todayCollection: todayCollection || 0,
    goldUnderCustody: goldUnderCustody || 0,
    inactiveChitMembers: arguments[arguments.length - 2] || 0,
    missedChitPayments: arguments[arguments.length - 1] || 0
  };
};

const getRevenueAnalytics = async () => {
  // Aggregate monthly revenue
  return await Payment.findAll({
    attributes: [
      [fn('DATE_TRUNC', 'month', col('paymentDate')), 'month'],
      [fn('SUM', col('paymentAmount')), 'revenue']
    ],
    group: [fn('DATE_TRUNC', 'month', col('paymentDate'))],
    order: [[fn('DATE_TRUNC', 'month', col('paymentDate')), 'DESC']],
    limit: 12
  });
};

const getOverdueLoansList = async () => {
  return await GoldLoan.findAll({
    where: { status: 'OVERDUE' },
    include: ['customer']
  });
};

module.exports = {
  getAdminSummary,
  getRevenueAnalytics,
  getOverdueLoansList
};
