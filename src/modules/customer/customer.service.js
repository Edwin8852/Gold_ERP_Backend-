const { Customer } = require('../../models');
const { Op } = require('sequelize');

/**
 * Customer Service
 * Logic for interacting with the database
 */
class CustomerService {
  async generateCustomerCode() {
    const lastCustomer = await Customer.findOne({
      order: [['createdAt', 'DESC']],
    });

    let nextNumber = 1001;
    if (lastCustomer && lastCustomer.customerCode) {
      const lastCode = lastCustomer.customerCode;
      const lastNumber = parseInt(lastCode.split('-')[1]);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return `CUST-${nextNumber}`;
  }

  async createCustomer(data, userId) {
    const customerCode = await this.generateCustomerCode();
    return await Customer.create({
      ...data,
      customerCode,
      createdBy: userId
    });
  }

  async getAllCustomers() {
    return await Customer.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  async getCustomerById(id) {
    const customer = await Customer.findByPk(id);
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  async updateCustomer(id, data) {
    const customer = await this.getCustomerById(id);
    return await customer.update(data);
  }

  async deleteCustomer(id) {
    const customer = await this.getCustomerById(id);
    await customer.destroy();
    return { message: 'Customer deleted successfully' };
  }

  async searchCustomers(query) {
    return await Customer.findAll({
      where: {
        [Op.or]: [
          { customerCode: { [Op.iLike]: `%${query}%` } },
          { mobileNumber: { [Op.iLike]: `%${query}%` } },
          { firstName: { [Op.iLike]: `%${query}%` } },
          { aadharNumber: { [Op.iLike]: `%${query}%` } }
        ]
      }
    });
  }
}

module.exports = new CustomerService();
