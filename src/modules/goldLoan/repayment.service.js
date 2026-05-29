const { Payment, GoldLoan, sequelize } = require('../../models');
const penaltyService = require('./penalty.service');

class RepaymentService {
  /**
   * Process a loan payment
   * @param {string} loanId 
   * @param {Object} paymentData - { amount, paymentType, method }
   * @param {string} userId - ID of person making the payment
   */
  async processPayment(loanId, paymentData, userId) {
    const paymentService = require('../payments/payment.service');
    const result = await paymentService.processPayment({
      loanId,
      paymentAmount: parseFloat(paymentData.amount || paymentData.paymentAmount),
      paymentMethod: paymentData.method || paymentData.paymentMethod || 'CASH',
      paymentType: paymentData.paymentType || 'EMI'
    }, userId);
    return result;
  }
}

module.exports = new RepaymentService();
