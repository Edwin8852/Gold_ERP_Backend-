const { GoldLoan } = require('../../models');
const loanHistoryService = require('./loanHistory.service');
const NotificationService = require('../notification/notification.service');

class PenaltyCalculationService {
  /**
   * Calculate penalty based on remaining principal and flat rate (e.g. 1.2%)
   */
  calculatePenalty(principal, rate = 1.2) {
    return parseFloat(((parseFloat(principal) * rate) / 100).toFixed(2));
  }

  /**
   * Automatically scans all ACTIVE loans and updates overdue status/penalties
   */
  async processOverdueLoans() {
    const activeLoans = await GoldLoan.findAll({
      where: {
        status: 'ACTIVE'
      }
    });

    const now = new Date();
    let updatedCount = 0;

    for (const loan of activeLoans) {
      if (loan.dueDate && new Date(loan.dueDate) < now) {
        const principal = parseFloat(loan.remainingPrincipal || 0);
        const penalty = this.calculatePenalty(principal);

        // Update status and penalty
        const oldStatus = loan.status;
        const newPenaltyAmount = parseFloat((parseFloat(loan.penaltyAmount || 0) + penalty).toFixed(2));
        
        await loan.update({
          status: 'OVERDUE',
          currentStatus: 'OVERDUE',
          penaltyAmount: newPenaltyAmount
        });

        // Log History
        await loanHistoryService.logHistory(
          loan.id,
          'PENALTY_ADDED',
          `Automated penalty of ₹${penalty} added due to overdue status. New penalty total: ₹${newPenaltyAmount}`
        );

        // Create alert notifications
        await NotificationService.createNotification({
          customerId: loan.customerId,
          type: 'LATE_PAYMENT',
          message: `Your loan ${loan.loanNumber} is OVERDUE. Penalty of ₹${penalty} has been added.`
        }).catch(err => console.error('[Notification Error]:', err.message));

        updatedCount++;
      }
    }

    return updatedCount;
  }
}

module.exports = new PenaltyCalculationService();
