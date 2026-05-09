const { Customer } = require('../../models');

/**
 * Customer Service
 * Logic for interacting with the database
 */
class CustomerService {
  async createCustomer(data) {
    return await Customer.create(data);
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
}

module.exports = new CustomerService();
