/**
 * Finance Utility Functions
 */
class FinanceUtils {
  /**
   * Calculate penalty based on overdue days
   * Standard logic: 2% of installment amount per month or fixed daily rate
   */
  calculateChitPenalty(amount, dueDate, currentDate = new Date()) {
    const due = new Date(dueDate);
    const now = new Date(currentDate);
    
    if (now <= due) return 0;

    const diffTime = Math.abs(now - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Example logic: Rs. 5 per day after 5 days grace period
    const gracePeriod = 5;
    if (diffDays <= gracePeriod) return 0;

    const penaltyPerDay = 5; 
    return (diffDays - gracePeriod) * penaltyPerDay;
  }

  /**
   * Format currency (Standard: INR)
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }
}

module.exports = new FinanceUtils();
