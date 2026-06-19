const { Order, Customer, sequelize } = require('../../models');
const InventoryService = require('../inventory/inventory.service');

/**
 * Order Service
 */
class OrderService {
  async createOrder(data, user = null) {
    if (data.deliveryDate === '') data.deliveryDate = null;
    if (data.remarks === '') data.remarks = null;

    if (user) {
      data.createdBy = user.id;
    }

    // Step 2 & 6: Validate Body & Billing Fields
    const requiredFields = ['customerId', 'ornamentType', 'purity', 'grossWeight', 'goldRate', 'finalAmount'];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        const error = new Error(`Missing required field: ${field}`);
        error.statusCode = 400;
        throw error;
      }
    }

    const numericFields = ['grossWeight', 'goldRate', 'finalAmount', 'wastageAmount', 'makingChargeAmount', 'totalGST', 'advanceAmount'];
    for (const field of numericFields) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        const val = parseFloat(data[field]);
        if (isNaN(val) || val < 0) {
          const error = new Error(`Invalid numeric field: ${field}`);
          error.statusCode = 400;
          throw error;
        }
      }
    }

    // Step 4: Validate Customer exists before creating order
    let customer = await Customer.findByPk(data.customerId);
    
    if (!customer) {
      // Fallback: If frontend passed User.id instead of Customer.id, resolve it
      const { User } = require('../../models');
      const linkedUser = await User.findByPk(data.customerId);
      if (linkedUser && linkedUser.customerCode) {
        customer = await Customer.findOne({ where: { customerCode: linkedUser.customerCode } });
        if (customer) {
          data.customerId = customer.id; // Swap to the actual Customer UUID
        }
      }
    }

    if (!customer) {
      const error = new Error('Customer not found');
      error.statusCode = 400;
      throw error;
    }

    let order = null;
    let retries = 0;
    
    // Step 9: Transaction Safety
    const t = await sequelize.transaction();

    try {
      while (!order && retries < 5) {
        try {
          const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const rand = Math.floor(1000 + Math.random() * 9000);
          data.orderNumber = `ORD-${date}-${rand}`;

          order = await Order.create(data, { transaction: t });
        } catch (err) {
          if (err.name === 'SequelizeUniqueConstraintError') {
            retries++;
          } else {
            throw err;
          }
        }
      }

      // Step 5: Validate Sequence Generation
      if (!order) {
        const error = new Error('Failed to generate a unique order number after multiple attempts.');
        error.statusCode = 500;
        throw error;
      }

      // Step 8: Notification Validation (Do not fail order creation if email fails)
      try {
        if (customer.email) {
          const emailService = require('../notification/email/email.service');
          emailService.sendJewelryOrderCreatedEmail(customer, order.orderNumber);
        }
      } catch (emailErr) {
        console.error('[OrderService] Warning: Failed to send order creation email:', emailErr.message);
      }

      await t.commit();
      return order;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getAllOrders(query = {}) {
    console.log('[DEBUG] Backend: Executing query to fetch all orders');
    try {
      const { search, customerId } = query;
      const { Op } = require('sequelize');
      const where = {};

      if (customerId) {
        where.customerId = customerId;
      }

      if (search) {
        where[Op.or] = [
          { orderNumber: { [Op.like]: `%${search}%` } },
          { '$customer.firstName$': { [Op.like]: `%${search}%` } },
          { '$customer.lastName$': { [Op.like]: `%${search}%` } },
          { '$customer.email$': { [Op.like]: `%${search}%` } },
          { '$customer.mobileNumber$': { [Op.like]: `%${search}%` } },
        ];
      }

      const orders = await Order.findAll({
        where,
        include: [{ 
          model: Customer, 
          as: 'customer', 
          attributes: ['firstName', 'lastName', 'email', 'mobileNumber'] 
        }],
        order: [['createdAt', 'DESC']],
      });
      console.log(`[DEBUG] Backend: Retrieved ${orders.length} orders from database`);
      return orders;
    } catch (error) {
      console.log(`[DEBUG] Backend Error: Failed to execute query - ${error.message}`);
      throw error;
    }
  }

  async getOrderById(id) {
    const order = await Order.findByPk(id, {
      include: [{ model: Customer, as: 'customer' }],
    });
    if (!order) throw new Error('Order not found');
    return order;
  }

  async updateOrder(id, data, user = null) {
    const order = await this.getOrderById(id);
    if (data.deliveryDate === '') data.deliveryDate = null;
    if (data.remarks === '') data.remarks = null;

    const previousStatus = order.status;
    const newStatus = data.status || previousStatus;
    
    // Status validation state machine
    if (previousStatus !== newStatus && newStatus !== 'CANCELLED') {
      const validTransitions = {
        'DRAFT': ['PENDING_ADVANCE'],
        'PENDING_ADVANCE': ['ADVANCE_PAID'],
        'ADVANCE_PAID': ['IN_PRODUCTION'],
        'IN_PRODUCTION': ['READY_FOR_DELIVERY'],
        'READY_FOR_DELIVERY': ['DELIVERED'],
      };

      if (!validTransitions[previousStatus] || !validTransitions[previousStatus].includes(newStatus)) {
        throw new Error(`Invalid status transition from ${previousStatus} to ${newStatus}`);
      }
    }

    const previousPaymentStatus = order.paymentStatus;
    let newPaymentStatus = data.paymentStatus || previousPaymentStatus;
    const newPaymentMethod = data.paymentMethod || order.paymentMethod;

    // Cash Handling Rules
    if (newPaymentMethod === 'CASH') {
      if (data.paymentStatus === 'PAID' && previousPaymentStatus !== 'PAID') {
        if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
          throw new Error('Only Admin or Super Admin can confirm physical cash payments.');
        }
      } else if (newPaymentStatus !== 'PAID' && newPaymentStatus !== 'ADVANCE_PAID') {
        newPaymentStatus = 'PENDING_CASH_COLLECTION';
      }
    }

    // Payment Flow Validations
    if (newStatus === 'IN_PRODUCTION' && previousStatus !== 'IN_PRODUCTION') {
      const advance = parseFloat(data.advanceAmount !== undefined ? data.advanceAmount : order.advanceAmount);
      if (advance <= 0 && newPaymentStatus !== 'PAID' && newPaymentStatus !== 'ADVANCE_PAID') {
        throw new Error('Cannot start production without an advance payment.');
      }
    }

    if (newStatus === 'DELIVERED' && previousStatus !== 'DELIVERED') {
      const balance = parseFloat(data.balanceAmount !== undefined ? data.balanceAmount : order.balanceAmount);
      if (balance > 0 || newPaymentStatus !== 'PAID') {
        throw new Error('Cannot deliver order until balance amount is fully paid.');
      }
    }

    // Audit Logging Updates
    if (newStatus !== previousStatus) {
      data.statusUpdatedAt = new Date();
      if (user) data.statusChangedBy = user.id;
    }

    if (newPaymentStatus !== previousPaymentStatus) {
      data.paymentUpdatedAt = new Date();
      if (newPaymentStatus === 'PAID' && user) {
        data.paymentConfirmedBy = user.id;
      }
    }
    
    data.paymentStatus = newPaymentStatus;

    // Start a transaction for safe stock deductions
    const t = await sequelize.transaction();

    try {
      await order.update(data, { transaction: t });

      // Inventory Integration
      if (user) {
        if (previousStatus !== 'IN_PRODUCTION' && newStatus === 'IN_PRODUCTION') {
          // Deduct stock
          await InventoryService.deductStock({
            itemName: `${order.purity} Gold`, // Try an exact match first or fallback
            purity: order.purity,
            quantity: order.grossWeight,
            remarks: `Order ${order.orderNumber} Production`,
            referenceId: order.id,
          }, user.id, t).catch(err => {
            console.error('Inventory auto-deduct failed:', err);
            throw err;
          });
        } else if (
          (previousStatus === 'IN_PRODUCTION' || previousStatus === 'READY_FOR_DELIVERY' || previousStatus === 'DELIVERED') 
          && newStatus === 'CANCELLED'
        ) {
          // Restore stock
          await InventoryService.addStock({
            itemName: `${order.purity} Gold`,
            purity: order.purity,
            unit: 'Gram',
            quantity: order.grossWeight,
            transactionType: 'ADJUSTMENT',
            remarks: `Order ${order.orderNumber} Cancelled - Stock Restored`,
          }, user.id, t).catch(err => console.error('Inventory auto-restore failed:', err));
        }
      }

      await t.commit();
      
      const updatedOrder = await this.getOrderById(id);

      try {
        if (previousStatus !== 'READY_FOR_DELIVERY' && newStatus === 'READY_FOR_DELIVERY') {
          const customer = updatedOrder.customer;
          if (customer && customer.email) {
            const emailService = require('../notification/email/email.service');
            emailService.sendJewelryReadyForDeliveryEmail(customer, updatedOrder.orderNumber);
          }
        }
      } catch (emailErr) {
        console.error('[OrderService] Failed to send order update email:', emailErr.message);
      }

      return updatedOrder;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async deleteOrder(id, user = null) {
    const order = await this.getOrderById(id);
    return await this.updateOrder(id, { status: 'CANCELLED' }, user);
  }
}

module.exports = new OrderService();
