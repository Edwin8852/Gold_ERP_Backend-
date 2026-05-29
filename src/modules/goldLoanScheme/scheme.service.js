const { GoldLoanScheme } = require('../../models');

class GoldLoanSchemeService {
  async createScheme(data, userId) {
    return await GoldLoanScheme.create({ ...data, createdBy: userId });
  }

  async getAllSchemes(filters = {}) {
    return await GoldLoanScheme.findAll({ where: filters, order: [['createdAt', 'DESC']] });
  }

  async getSchemeById(id) {
    const scheme = await GoldLoanScheme.findByPk(id);
    if (!scheme) throw new Error('Loan scheme not found');
    return scheme;
  }

  async updateScheme(id, data) {
    const scheme = await this.getSchemeById(id);
    return await scheme.update(data);
  }

  async deleteScheme(id) {
    const scheme = await this.getSchemeById(id);
    return await scheme.destroy();
  }
}

module.exports = new GoldLoanSchemeService();
