class PenaltyService {
  /**
   * Formula: Penalty = Overdue Amount × Penalty Rate
   */
  calculatePenalty(overdueAmount, penaltyRate) {
    return (overdueAmount * penaltyRate) / 100;
  }
}

module.exports = new PenaltyService();
