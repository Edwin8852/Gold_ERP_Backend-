class EligibilityService {
  /**
   * Formula: Eligible Loan = Gold Value × LTV Percentage
   */
  calculateEligibility(goldValue, ltvPercentage, requestedAmount) {
    const eligibleAmount = goldValue * (ltvPercentage / 100);
    const isEligible = requestedAmount <= eligibleAmount;

    return {
      eligibleAmount,
      requestedAmount,
      isEligible,
      ltvPercentage
    };
  }
}

module.exports = new EligibilityService();
