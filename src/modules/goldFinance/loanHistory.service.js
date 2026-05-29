const { LoanHistory, GoldLoan, Customer } = require('../../models');

const logHistory = async (loanId, action, remarks = '', options = {}) => {
  try {
    console.log(`[LoanHistoryService] Logging action: ${action} for Loan ID: ${loanId}`);
    return await LoanHistory.create({
      loanId,
      action,
      remarks
    }, options);
  } catch (error) {
    console.error('[LoanHistoryService] Failed to create loan history log:', error.message);
  }
};

const getLoanHistory = async (loanId) => {
  return await LoanHistory.findAll({
    where: { loanId },
    order: [['createdAt', 'ASC']]
  });
};

module.exports = {
  logHistory,
  getLoanHistory
};
