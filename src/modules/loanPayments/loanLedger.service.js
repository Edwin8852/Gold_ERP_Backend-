const { LoanLedger } = require('../../models');

class LoanLedgerService {
  /**
   * Get ledger record for a loan
   */
  async getLedgerByLoanId(loanId) {
    return await LoanLedger.findOne({ where: { loanId } });
  }

  /**
   * Initialize or update a ledger record for a loan
   */
  async updateLedger(loan, options = {}) {
    const { transaction } = options;
    const loanId = loan.id;
    const customerId = loan.customerId;

    let ledger = await LoanLedger.findOne({ where: { loanId }, transaction });

    const totalLoanAmount = parseFloat(loan.loanAmount || loan.approvedAmount || 0);
    const totalPaidAmount = parseFloat(loan.totalPaid || 0);
    const remainingBalance = parseFloat(loan.remainingPrincipal || 0);
    const totalInterestPaid = parseFloat(loan.totalInterestPaid || 0);
    const totalPenaltyPaid = parseFloat(loan.totalPenalty || 0);
    const nextDueDate = loan.nextDueDate || loan.dueDate;
    const lastPaymentDate = loan.lastPaymentDate;

    if (!ledger) {
      ledger = await LoanLedger.create({
        loanId,
        customerId,
        totalLoanAmount,
        totalPaidAmount,
        remainingBalance,
        totalInterestPaid,
        totalPenaltyPaid,
        nextDueDate,
        lastPaymentDate
      }, { transaction });
    } else {
      await ledger.update({
        totalLoanAmount,
        totalPaidAmount,
        remainingBalance,
        totalInterestPaid,
        totalPenaltyPaid,
        nextDueDate,
        lastPaymentDate
      }, { transaction });
    }

    return ledger;
  }
}

module.exports = new LoanLedgerService();
