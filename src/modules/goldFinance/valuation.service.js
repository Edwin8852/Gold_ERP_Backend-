/**
 * Gold Valuation Service
 * Handles complex calculations for gold value and loan eligibility
 */
const goldRateService = require('../goldRates/goldRate.service');

class ValuationService {
  /**
   * Calculate full valuation for a loan request
   * @param {Object} data - { weight, purity, requestedAmount }
   * @returns {Object} - Valuation result
   */
  async calculateValuation(data) {
    const { weight, purity, requestedAmount } = data;
    
    // Fetch current market rate
    const currentRate = await goldRateService.getCurrentRate();
    if (!currentRate) {
      throw new Error('Could not fetch current gold rates. Please try again later.');
    }

    // Determine base rate based on purity
    const baseRate = purity === '24K' ? currentRate.gold24KRate : currentRate.gold22KRate;
    
    // Gross Value
    const estimatedGoldValue = weight * baseRate;
    
    // Configurable LTV (Loan to Value) - Default 75%
    const ltvRatio = 0.75;
    const eligibleLoanAmount = estimatedGoldValue * ltvRatio;

    return {
      marketRate: baseRate,
      estimatedGoldValue,
      ltvRatio,
      eligibleLoanAmount,
      requestedAmount: parseFloat(requestedAmount),
      isEligible: parseFloat(requestedAmount) <= eligibleLoanAmount,
      diffAmount: parseFloat(requestedAmount) - eligibleLoanAmount
    };
  }
}

module.exports = new ValuationService();
