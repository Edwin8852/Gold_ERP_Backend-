const { Payment, GoldLoan } = require('../../models');

class RiskService {
  /**
   * Rules: on-time payment → lower risk, late payment → increase risk
   */
  async assessCustomerRisk(customerId) {
    const loans = await GoldLoan.findAll({ where: { customerId } });
    
    let totalLoans = loans.length;
    let overdueLoans = loans.filter(l => l.status === 'OVERDUE').length;
    let score = 100; // Start with perfect score

    if (totalLoans > 0) {
      score -= (overdueLoans / totalLoans) * 50;
    }

    let category = 'LOW';
    if (score < 40) category = 'CRITICAL';
    else if (score < 60) category = 'HIGH';
    else if (score < 80) category = 'MEDIUM';

    return {
      riskScore: Math.round(score),
      category
    };
  }
}

module.exports = new RiskService();
