const { LoanHistory } = require('../../models');

class LoanHistoryService {
  async logHistory(loanId, action, remarks = '', options = {}) {
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
  }

  async getLoanHistory(loanId) {
    return await LoanHistory.findAll({
      where: { loanId },
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = new LoanHistoryService();
