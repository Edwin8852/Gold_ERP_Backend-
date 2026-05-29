const { ChitFundPayment, ChitFundPaymentHistory, ChitReceipt, ChitSubscriber, sequelize } = require('../../models');
const AppError = require('../../shared/utils/AppError');

class ChitFundPaymentService {
  async processPayment(subscriberId, paymentData, userId) {
    const t = await sequelize.transaction();
    try {
      const subscriber = await ChitSubscriber.findByPk(subscriberId, { transaction: t });
      if (!subscriber) throw new AppError('Chit subscriber not found', 404);

      const amountPaid = parseFloat(paymentData.amountPaid);
      let newPendingAmount = parseFloat(subscriber.pendingAmount) || 0;
      let newTotalPaid = (parseFloat(subscriber.totalPaid) || 0) + amountPaid;
      let newStatus = subscriber.status;

      // Chit Fund distinct logic
      if (paymentData.paymentType === 'MONTHLY_INSTALLMENT') {
        newPendingAmount -= amountPaid;
      } else if (paymentData.paymentType === 'ADVANCE_PAYMENT') {
        newPendingAmount -= amountPaid; // Advance covers future pending
      } else if (paymentData.paymentType === 'MISSED_PAYMENT') {
        newPendingAmount -= amountPaid;
      }

      if (newPendingAmount <= 0) newPendingAmount = 0;

      // 1. Create Independent Payment Record
      const payment = await ChitFundPayment.create({
        chitSubscriberId: subscriber.id,
        paymentType: paymentData.paymentType,
        paymentMethod: paymentData.paymentMethod || 'CASH',
        paymentSource: paymentData.paymentSource || 'ADMIN_COLLECTION',
        amountPaid,
        installmentMonth: paymentData.installmentMonth,
        penaltyWaiver: paymentData.penaltyWaiver || 0,
        outstandingPendingAfter: newPendingAmount,
        referenceNumber: paymentData.referenceNumber,
        remarks: paymentData.remarks,
        createdBy: userId
      }, { transaction: t });

      // 2. Log History independently
      await ChitFundPaymentHistory.create({
        chitFundPaymentId: payment.id,
        action: 'PAYMENT_PROCESSED',
        remarks: `Processed ${paymentData.paymentType} of ₹${amountPaid}`,
        oldStatus: subscriber.status,
        newStatus: newStatus,
        createdBy: userId
      }, { transaction: t });

      // 3. Generate receipt record
      await ChitReceipt.create({
        chitFundPaymentId: payment.id,
        receiptNumber: `C-REC-${Date.now()}`,
        generatedBy: userId
      }, { transaction: t });

      // 4. Update the actual subscriber
      await subscriber.update({
        totalPaid: newTotalPaid,
        pendingAmount: newPendingAmount,
        status: newStatus
      }, { transaction: t });

      await t.commit();
      return payment;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getChitPayments(filters) {
    const { Op } = require('sequelize');
    const { Customer, ChitScheme, User } = require('../../models');

    const where = {};
    if (filters.chitSubscriberId) {
      where.chitSubscriberId = filters.chitSubscriberId;
    }
    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const subscriberWhere = {};
    if (filters.schemeId) {
      subscriberWhere.schemeId = filters.schemeId;
    }

    if (filters.searchTerm) {
      const search = `%${filters.searchTerm}%`;
      where[Op.or] = [
        { invoiceNumber: { [Op.iLike]: search } },
        { referenceNumber: { [Op.iLike]: search } },
        { '$subscriber.customer.firstName$': { [Op.iLike]: search } },
        { '$subscriber.customer.lastName$': { [Op.iLike]: search } },
        { '$subscriber.customer.customerCode$': { [Op.iLike]: search } },
        { '$subscriber.customer.mobileNumber$': { [Op.iLike]: search } },
        { '$subscriber.scheme.name$': { [Op.iLike]: search } }
      ];
    }

    return await ChitFundPayment.findAll({
      where,
      order: [['paymentDate', 'DESC']],
      include: [
        {
          model: ChitSubscriber,
          as: 'subscriber',
          where: Object.keys(subscriberWhere).length > 0 ? subscriberWhere : undefined,
          include: [
            {
              model: Customer,
              as: 'customer'
            },
            {
              model: ChitScheme,
              as: 'scheme'
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
  }
}

module.exports = new ChitFundPaymentService();
