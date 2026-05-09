const { ChitFund, Customer } = require('../../models');

/**
 * Chit Fund Service
 */
class ChitfundService {
  async createSubscription(data) {
    return await ChitFund.create(data);
  }

  async getAllSubscriptions() {
    return await ChitFund.findAll({
      include: [{ model: Customer, as: 'customer', attributes: ['firstName', 'lastName', 'email', 'phoneNumber'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async getSubscriptionById(id) {
    const chit = await ChitFund.findByPk(id, {
      include: [{ model: Customer, as: 'customer' }],
    });
    if (!chit) throw new Error('Chit Fund subscription not found');
    return chit;
  }

  async updateSubscription(id, data) {
    const chit = await this.getSubscriptionById(id);
    return await chit.update(data);
  }

  async deleteSubscription(id) {
    const chit = await this.getSubscriptionById(id);
    await chit.destroy();
    return { message: 'Chit Fund subscription removed successfully' };
  }
}

module.exports = new ChitfundService();
