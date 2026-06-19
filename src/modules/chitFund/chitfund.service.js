const { ChitScheme, ChitSubscriber, ChitInstallment, Customer, User, sequelize, Notification } = require('../../models');
const { Op } = require('sequelize');
const NotificationService = require('../notification/notification.service');

class ChitFundService {
  /**
   * Create a new Chit Scheme
   */
  async createScheme(data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Default values
    data.isActive = true;
    data.launchDate = new Date();
    
    if (data.startDate) {
      const startDate = new Date(data.startDate);
      if (startDate <= today) {
        data.status = 'ACTIVE';
      } else {
        data.status = 'UPCOMING';
      }
      
      // Calculate Expiry Date
      if (data.durationMonths) {
        const expiry = new Date(startDate);
        expiry.setMonth(expiry.getMonth() + parseInt(data.durationMonths));
        data.expiryDate = expiry;
      }
    }
    return await ChitScheme.create(data);
  }

  /**
   * Get all Chit Schemes with optional filters
   */
  async getAllSchemes(filters = {}) {
    const schemes = await ChitScheme.findAll({
      where: filters,
      include: [{ model: ChitSubscriber, as: 'subscribers', attributes: ['id'] }],
      order: [['createdAt', 'DESC']]
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let scheme of schemes) {
      let changed = false;
      if (scheme.status === 'UPCOMING') {
        const startDate = new Date(scheme.startDate);
        if (startDate <= today) {
          scheme.status = 'ACTIVE';
          scheme.isActive = true;
          changed = true;
        }
      } else if (scheme.status === 'ACTIVE' && scheme.expiryDate) {
         const expiry = new Date(scheme.expiryDate);
         if (today > expiry) {
            scheme.status = 'COMPLETED';
            scheme.isActive = false;
            changed = true;
         }
      }
      if (changed) await scheme.save();
    }
    
    return schemes;
  }

  /**
   * Get Active & Upcoming Schemes (Customer Facing)
   */
  async getAvailableSchemes(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    
    const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
    if (!customer) throw new Error('Customer profile not found');

    const activeSchemes = await ChitScheme.findAll({
      where: { 
        status: ['ACTIVE', 'UPCOMING'],
        isActive: true
      },
      order: [['startDate', 'ASC']]
    });

    // Check which ones the user is already enrolled in
    const joinedSubscriptions = await ChitSubscriber.findAll({
      where: { customerId: customer.id },
      attributes: ['schemeId']
    });
    
    const joinedSchemeIds = joinedSubscriptions.map(sub => sub.schemeId);

    // Add a flag to indicate if joined
    return activeSchemes.map(scheme => {
      const isJoined = joinedSchemeIds.includes(scheme.id);
      const isFull = scheme.currentSubscribers >= scheme.maxSubscribers;
      return {
        ...scheme.toJSON(),
        isJoined,
        isFull,
        canJoin: !isJoined && !isFull && scheme.status === 'ACTIVE'
      };
    });
  }

  /**
   * Update Chit Scheme
   */
  async updateScheme(id, data) {
    const scheme = await ChitScheme.findByPk(id);
    if (!scheme) throw new Error('Scheme not found');

    if (scheme.currentSubscribers > 0) {
      if (data.schemeName) scheme.schemeName = data.schemeName;
      if (data.description) scheme.description = data.description;
    } else {
      // If no subscribers, allow updating other fields too
      Object.assign(scheme, data);
      
      // Check status again if startDate changed
      if (data.startDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(data.startDate);
        if (startDate <= today) {
          scheme.status = 'ACTIVE';
        } else {
          scheme.status = 'UPCOMING';
        }
      }
    }
    
    await scheme.save();
    return scheme;
  }

  /**
   * Delete Chit Scheme
   */
  async deleteScheme(id) {
    const scheme = await ChitScheme.findByPk(id);
    if (!scheme) throw new Error('Scheme not found');

    if (scheme.currentSubscribers > 0) {
      throw new Error('Cannot delete scheme with enrolled subscribers');
    }

    await scheme.destroy();
    return true;
  }

  /**
   * Enroll a Customer into a Scheme
   */
  async enrollSubscriber(schemeId, providedCustomerId, userContext = null) {
    const transaction = await sequelize.transaction();
    try {
      let customerId = providedCustomerId;
      
      // If customerId is missing and a user context is provided, look it up (Self-Enrollment)
      if (!customerId && userContext && userContext.role === 'CUSTOMER') {
        const user = await User.findByPk(userContext.id, { transaction });
        if (!user) throw new Error('Authenticated user not found');
        const customer = await Customer.findOne({ where: { customerCode: user.customerCode }, transaction });
        if (!customer) throw new Error('Customer profile not found');
        customerId = customer.id;
      }

      if (!customerId) throw new Error('Customer ID is required');

      const scheme = await ChitScheme.findByPk(schemeId, { transaction });
      if (!scheme) throw new Error('Scheme not found');
      if (scheme.currentSubscribers >= scheme.maxSubscribers) throw new Error('Scheme is full');
      if (scheme.status !== 'UPCOMING' && scheme.status !== 'ACTIVE') throw new Error('Cannot enroll in this scheme');

      // Check if already enrolled
      const existing = await ChitSubscriber.findOne({ 
        where: { schemeId, customerId },
        transaction 
      });
      if (existing) throw new Error('Customer already enrolled in this scheme');
      
      // Ensure scheme hasn't expired
      if (scheme.expiryDate) {
         const today = new Date();
         today.setHours(0,0,0,0);
         if (today > new Date(scheme.expiryDate)) {
             throw new Error('This scheme has expired and cannot be joined.');
         }
      }

      const ticketNumber = scheme.currentSubscribers + 1;

      const subscriber = await ChitSubscriber.create({
        schemeId,
        customerId,
        ticketNumber,
        joiningDate: new Date(),
        status: 'ACTIVE'
      }, { transaction });

      // Update current subscribers count
      await scheme.increment('currentSubscribers', { by: 1, transaction });

      // Generate initial installments
      const installments = [];
      const startDate = new Date(scheme.startDate);

      for (let i = 1; i <= scheme.durationMonths; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        
        installments.push({
          subscriberId: subscriber.id,
          installmentNumber: i,
          dueDate: dueDate,
          payableAmount: scheme.monthlyInstallment,
          status: 'PENDING'
        });
      }

      await ChitInstallment.bulkCreate(installments, { transaction });

      await transaction.commit();
      return subscriber;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Record an Installment Payment
   */
  async collectPayment(installmentId, paymentData) {
    const { ChitFundPayment, ChitSubscriber, ChitScheme, Customer, User } = require('../../models');
    const transaction = await sequelize.transaction();
    try {
      const installment = await ChitInstallment.findByPk(installmentId, {
        include: [
          {
            model: ChitSubscriber,
            as: 'subscriber',
            include: [{ model: ChitScheme, as: 'scheme' }]
          }
        ],
        transaction
      });

      if (!installment) throw new Error('Installment not found');
      if (installment.status === 'PAID') throw new Error('Installment already paid');

      const paidAmount = parseFloat(paymentData.amount);
      const penalty = parseFloat(paymentData.penalty || 0);

      // Normalize paymentMethod to valid enum values
      const VALID_PAYMENT_METHODS = ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'MANUAL_ENTRY'];
      let paymentMethod = (paymentData.paymentMethod || 'CASH').toUpperCase();
      if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        // Map common aliases
        if (paymentMethod === 'ONLINE' || paymentMethod === 'NET_BANKING') paymentMethod = 'UPI';
        else paymentMethod = 'CASH'; // safe fallback
      }

      // 1. Prevent duplicate payments by checking transactionId in ChitFundPayment
      if (paymentData.transactionId) {
        const duplicate = await ChitFundPayment.findOne({
          where: { referenceNumber: paymentData.transactionId },
          transaction
        });
        if (duplicate) {
          throw new Error('Duplicate payment detected: Transaction ID already processed.');
        }
      }

      // 2. Determine createdBy cleanly
      let createdBy = paymentData.createdBy;
      if (!createdBy) {
        const subscriberCust = await Customer.findByPk(installment.subscriber.customerId, { transaction });
        if (subscriberCust && subscriberCust.customerCode) {
          const customerUser = await User.findOne({ where: { customerCode: subscriberCust.customerCode }, transaction });
          if (customerUser) {
            createdBy = customerUser.id;
          }
        }
      }
      if (!createdBy) {
        const adminUser = await User.findOne({ transaction });
        if (adminUser) {
          createdBy = adminUser.id;
        } else {
          createdBy = installment.subscriber.customerId; // Safe fallback
        }
      }

      const finalTransactionId = paymentData.transactionId || `TXN-CHIT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. Update the installment details
      await installment.update({
        paidAmount: paidAmount,
        penaltyAmount: penalty,
        paymentDate: new Date(),
        paymentMethod: paymentMethod,
        transactionId: finalTransactionId,
        status: paidAmount >= installment.payableAmount ? 'PAID' : 'PARTIAL',
        remarks: paymentData.remarks
      }, { transaction });

      const subscriber = installment.subscriber;
      const scheme = subscriber.scheme;

      // 4. Compute metrics
      const newTotalPaidAmount = (parseFloat(subscriber.totalPaidAmount) || 0) + paidAmount;
      const newRemainingAmount = Math.max(0, parseFloat(scheme.totalAmount) - newTotalPaidAmount);
      
      // Calculate completed and pending installments
      const completedInstallments = await ChitInstallment.count({
        where: {
          subscriberId: subscriber.id,
          status: 'PAID'
        },
        transaction
      });
      const pendingInstallments = Math.max(0, parseInt(scheme.durationMonths) - completedInstallments);

      // Get next due date
      const nextPendingInstallment = await ChitInstallment.findOne({
        where: {
          subscriberId: subscriber.id,
          status: { [Op.ne]: 'PAID' }
        },
        order: [['installmentNumber', 'ASC']],
        transaction
      });
      const nextDueDate = nextPendingInstallment ? nextPendingInstallment.dueDate : null;

      // Determine overdue count for currentStatus
      const overdueCount = await ChitInstallment.count({
        where: {
          subscriberId: subscriber.id,
          status: { [Op.ne]: 'PAID' },
          dueDate: { [Op.lt]: new Date() }
        },
        transaction
      });

      const currentStatus = completedInstallments === scheme.durationMonths
        ? 'FULLY_PAID'
        : (overdueCount > 0 ? 'OVERDUE' : 'PARTIAL_PAID');

      // Update Subscriber (with new and old fields)
      await subscriber.update({
        totalPaid: newTotalPaidAmount,
        pendingAmount: newRemainingAmount,
        status: completedInstallments === scheme.durationMonths ? 'COMPLETED' : (overdueCount > 0 ? 'DEFAULTED' : 'ACTIVE'),
        currentStatus,
        totalPaidAmount: newTotalPaidAmount,
        remainingAmount: newRemainingAmount,
        completedInstallments,
        pendingInstallments,
        lastPaymentDate: new Date(),
        nextDueDate
      }, { transaction });

      // 5. Create the detailed ChitFundPayment record
      const invoiceNumber = `INV-CHIT-${Date.now()}`;
      const payment = await ChitFundPayment.create({
        chitSubscriberId: subscriber.id,
        paymentType: 'MONTHLY_INSTALLMENT',
        paymentMethod: paymentMethod,
        paymentSource: paymentData.paymentSource || 'ADMIN_COLLECTION',
        amountPaid: paidAmount,
        installmentMonth: installment.installmentNumber,
        installmentNumber: installment.installmentNumber,
        remainingBalance: newRemainingAmount,
        outstandingPendingAfter: newRemainingAmount,
        paymentStatus: paidAmount >= installment.payableAmount ? 'INSTALLMENT_PAID' : 'PARTIAL_PAID',
        invoiceNumber,
        referenceNumber: finalTransactionId,
        remarks: paymentData.remarks,
        status: 'SUCCESS',
        createdBy
      }, { transaction });

      // 6. Generate the invoice PDF using pdfService
      const pdfService = require('../pdf/pdf.service');
      const pdfUrl = await pdfService.generateChitInvoicePDF(payment.id, { transaction });
      
      // Update payment record with PDF URL
      await payment.update({ invoiceUrl: pdfUrl }, { transaction });

      // 7. Create notification for customer
      try {
        const customer = await Customer.findByPk(subscriber.customerId, { transaction });
        if (customer) {
          const emailService = require('../notification/email/email.service');
          if (customer.email) {
            emailService.sendChitFundPaymentEmail(customer, paidAmount, scheme.schemeName);
          }
          await NotificationService.createNotification({
            customerId: customer.id,
            type: 'PAYMENT_SUCCESS',
            message: `Your monthly chit payment of ₹${paidAmount} for ${scheme.schemeName} has been completed successfully. Invoice: ${invoiceNumber}`,
            metadata: {
              installmentId: installment.id,
              amount: paidAmount,
              paymentDate: new Date(),
              nextDueDate
            }
          });
        }
      } catch (notifyErr) {
        console.error('Failed to send payment notification:', notifyErr);
      }

      await transaction.commit();
      return installment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get Subscriber Details with Installment History
   */
  async getSubscriberDetails(subscriberId) {
    return await ChitSubscriber.findByPk(subscriberId, {
      include: [
        { model: ChitScheme, as: 'scheme' },
        { model: Customer, as: 'customer' },
        { model: ChitInstallment, as: 'installments', order: [['installmentNumber', 'ASC']] }
      ]
    });
  }

  /**
   * Get All Subscriptions for a Customer
   */
  async getMySubscriptions(userId) {
    // Get customer profile first
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    
    const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
    if (!customer) throw new Error('Customer profile not found');

    return await ChitSubscriber.findAll({
      where: { customerId: customer.id },
      include: [
        { model: ChitScheme, as: 'scheme' },
        { 
            model: ChitInstallment, 
            as: 'installments',
            where: { status: { [Op.ne]: 'PAID' } },
            required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get Near Due Reminders (2 days before)
   */
  async getUpcomingDueReminders() {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    // Start of the day 2 days from now
    const startDate = new Date(twoDaysFromNow.setHours(0,0,0,0));
    // End of the day 2 days from now
    const endDate = new Date(twoDaysFromNow.setHours(23,59,59,999));

    return await ChitInstallment.findAll({
      where: {
        status: 'PENDING',
        dueDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        { 
          model: ChitSubscriber, 
          as: 'subscriber',
          include: [{ model: Customer, as: 'customer' }]
        }
      ]
    });
  }

  /**
   * Get Subscriber with ALL history (for dashboard cards)
   */
  async getFullSubscriptionDetails(userId) {
    const user = await User.findByPk(userId);
    const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
    
    return await ChitSubscriber.findAll({
      where: { customerId: customer.id },
      include: [
        { model: ChitScheme, as: 'scheme' },
        { model: ChitInstallment, as: 'installments', order: [['installmentNumber', 'ASC']] }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get All Subscriptions for Admin
   */
  async getAllSubscriptions() {
    return await ChitSubscriber.findAll({
      include: [
        { model: ChitScheme, as: 'scheme' },
        { model: Customer, as: 'customer' },
        { model: ChitInstallment, as: 'installments', order: [['dueDate', 'ASC']] }
      ],
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = new ChitFundService();
