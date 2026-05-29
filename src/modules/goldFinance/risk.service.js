/**
 * Risk Assessment Service
 * Evaluates customer risk based on history and status
 */
const { Customer, GoldLoan } = require('../../models');

class RiskService {
  /**
   * Assess risk for a customer applying for a loan
   * @param {string} customerId 
   * @returns {Object} - Risk snapshot
   */
  async assessCustomerRisk(customerId) {
    const customer = await Customer.findByPk(customerId, {
      include: [{ model: GoldLoan, as: 'loans' }]
    });

    if (!customer) throw new Error('Customer not found');

    let riskScore = 0;
    let factors = [];

    // Factor 1: Previous Loan History
    const closedLoans = customer.loans?.filter(l => l.status === 'CLOSED') || [];
    const overdueLoans = customer.loans?.filter(l => l.status === 'OVERDUE') || [];

    if (overdueLoans.length > 0) {
      riskScore += 40;
      factors.push('History of overdue loans');
    }

    if (closedLoans.length > 3) {
      riskScore -= 10;
      factors.push('Strong repayment history');
    }

    // Factor 2: KYC Status
    if (customer.kycStatus !== 'VERIFIED') {
      riskScore += 30;
      factors.push('KYC not verified');
    }

    // Normalize score
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Categorize
    let category = 'LOW';
    if (riskScore > 75) category = 'CRITICAL';
    else if (riskScore > 50) category = 'HIGH';
    else if (riskScore > 25) category = 'MEDIUM';

    return {
      riskScore,
      category,
      factors,
      requiresManualReview: category === 'HIGH' || category === 'CRITICAL'
    };
  }
}

module.exports = new RiskService();
