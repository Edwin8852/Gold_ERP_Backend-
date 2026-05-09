const { Order, Customer } = require('../../models');

/**
 * Order Service
 */
class OrderService {
  async createOrder(data) {
    // Generate a simple Order Number: ORD-YYYYMMDD-RAND
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    data.orderNumber = `ORD-${date}-${rand}`;

    return await Order.create(data);
  }

  async getAllOrders() {
    return await Order.findAll({
      include: [{ model: Customer, as: 'customer', attributes: ['firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async getOrderById(id) {
    const order = await Order.findByPk(id, {
      include: [{ model: Customer, as: 'customer' }],
    });
    if (!order) throw new Error('Order not found');
    return order;
  }

  async updateOrder(id, data) {
    const order = await this.getOrderById(id);
    return await order.update(data);
  }

  async deleteOrder(id) {
    const order = await this.getOrderById(id);
    await order.destroy();
    return { message: 'Order deleted successfully' };
  }
}

module.exports = new OrderService();
