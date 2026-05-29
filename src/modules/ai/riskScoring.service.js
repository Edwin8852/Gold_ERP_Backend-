const { Customer, GoldLoan, ChitInstallment, Document, db } = require('../../models');
const { Op } = require('sequelize');

class RiskScoringService {
  /**
   * Calculate Risk Score for a single customer
   * Logic: 0 (Safe) to 100 (Critical Risk)
   */
  async calculateCustomerRisk(customerId) {
    const customer = await Customer.findByPk(customerId, {
      include: [
        { model: GoldLoan, as: 'loans', where: { status: 'ACTIVE' }, required: false },
        { model: Document, as: 'documents', required: false }
      ]
    });

    if (!customer) return 0;

    let score = 0;

    // 1. KYC Compliance (10%)
    if (customer.kycStatus !== 'VERIFIED') score += 10;

    // 2. Loan Overdue Analysis (40%)
    const overdueLoans = await GoldLoan.count({
      where: { customerId, status: 'ACTIVE', dueDate: { [Op.lt]: new Date() } }
    });
    if (overdueLoans > 0) score += Math.min(overdueLoans * 15, 40);

    // 3. Chit Installment Overdue Analysis (30%)
    // Assuming we have access to ChitInstallment via subscriber
    const overdueChits = await ChitInstallment.count({
      where: { status: 'OVERDUE' },
      include: [{
        model: require('../../models').ChitSubscriber,
        as: 'subscriber',
        where: { customerId }
      }]
    });
    if (overdueChits > 0) score += Math.min(overdueChits * 10, 30);

    // 4. Portfolio Exposure (20%)
    const activeLoanCount = customer.loans?.length || 0;
    if (activeLoanCount > 3) score += 10;
    if (activeLoanCount > 5) score += 10;

    // Normalize and update
    const finalScore = Math.min(score, 100);
    
    await customer.update({
      riskScore: finalScore,
      lastRiskUpdate: new Date()
    });

    return finalScore;
  }

  /**
   * Run risk analysis for all active customers
   */
  async runGlobalRiskAnalysis() {
    const customers = await Customer.findAll({ attributes: ['id'] });
    console.log(`[AI Risk Engine] Starting global analysis for ${customers.length} customers...`);
    
    for (const customer of customers) {
      await this.calculateCustomerRisk(customer.id);
    }
    
    console.log(`[AI Risk Engine] Global analysis complete.`);
  }

  /**
   * Get High Risk Accounts for Dashboard
   */
  async getHighRiskAccounts(limit = 10) {
    return await Customer.findAll({
      where: { riskScore: { [Op.gte]: 50 } },
      order: [['riskScore', 'DESC']],
      limit,
      attributes: ['id', 'firstName', 'lastName', 'customerCode', 'riskScore', 'mobileNumber']
    });
  }

  /**
   * Predictive Analysis: Forecast potential default
   */
  async predictPotentialDefaults() {
    // Advanced logic: Customers with risk score increasing > 20% in 30 days
    // This requires history tracking (could be added to a separate table)
    // For now, return accounts with risk > 70
    return await Customer.findAll({
      where: { riskScore: { [Op.gte]: 70 } },
      include: [{ model: GoldLoan, as: 'loans', where: { status: 'ACTIVE' } }]
    });
  }
}

module.exports = new RiskScoringService();
