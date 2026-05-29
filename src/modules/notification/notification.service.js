const { Notification, Customer, ChitFund, GoldLoan } = require('../../models');
const WhatsAppService = require('./whatsapp/whatsapp.service');
const EmailService = require('./email/email.service');
const { Op } = require('sequelize');

/**
 * Notification Service
 * Handles business logic for manual and automated notifications
 */
class NotificationService {
  /**
   * Create a notification record and send via WhatsApp & Email
   */
  async createNotification(data) {
    const { customerId, type, message } = data;
    
    // Create record in database
    const notification = await Notification.create({
      customerId,
      type,
      message,
      isRead: false
    });

    // Fetch customer details for notifications
    const customer = await Customer.findByPk(customerId);
    if (customer) {
      // Send WhatsApp
      if (customer.mobileNumber) {
        WhatsAppService.sendWhatsAppNotification(customer.mobileNumber, message).catch(console.error);
      }
      
      // Send Email
      if (customer.email) {
        if (type === 'GOLD_LOAN_PRE_APPROVED') {
          EmailService.sendGoldLoanPreApprovalEmail(customer, message).catch(console.error);
        } else if (type === 'KYC_UPLOAD_REQUEST') {
          EmailService.sendKycUploadRequestEmail(customer, message).catch(console.error);
        } else {
          EmailService.sendEmail(customer.email, `SDRS Gold Notification: ${type.replace(/_/g, ' ')}`, `<p>${message}</p>`).catch(console.error);
        }
      }
    }

    return notification;
  }


  async getAllNotifications(filters = {}) {
    return await Notification.findAll({
      where: filters,
      include: [{ model: Customer, as: 'customer', attributes: ['firstName', 'lastName', 'mobileNumber'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  async getNotificationById(id) {
    return await Notification.findByPk(id, {
      include: [{ model: Customer, as: 'customer', attributes: ['firstName', 'lastName', 'mobileNumber'] }]
    });
  }

  async markAsRead(id) {
    const notification = await Notification.findByPk(id);
    if (!notification) throw new Error('Notification not found');
    
    notification.isRead = true;
    await notification.save();
    return notification;
  }

  /**
   * Auto-generate reminders for Chit Funds and Gold Loans
   * Called by Cron Job twice daily
   */
  async generateAutomatedReminders() {
    const today = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(today.getDate() + 2);

    const twoDaysFromNowStr = twoDaysFromNow.toISOString().split('T')[0];

    // 1. Chit Fund Reminders (monthly installment reminder)
    // Assuming we notify 2 days before the "monthly anniversary" of the start date
    // For simplicity, let's say we check if (today's day + 2) matches the start date's day
    const chitFunds = await ChitFund.findAll({ where: { status: 'Active' } });
    for (const chit of chitFunds) {
      const startDate = new Date(chit.startDate);
      if (startDate.getDate() === twoDaysFromNow.getDate()) {
        await this.createNotification({
          customerId: chit.customerId,
          type: 'CHIT_FUND_ALERT',
          message: `Reminder: Your monthly installment of ₹${chit.monthlyContribution} for ${chit.schemeName} is due in 2 days.`
        });
      }

      // 2. Chit Fund Completion (after 20 months)
      if (chit.currentInstallment >= 20 && chit.status !== 'Completed') {
        await this.createNotification({
          customerId: chit.customerId,
          type: 'CHIT_FUND_COMPLETION',
          message: `Congratulations! Your 20-month chit fund ${chit.schemeName} is completed. Please visit the branch for closure.`
        });
        chit.status = 'Completed';
        await chit.save();
      }
    }

    // 3. Gold Loan Interest Reminders
    const goldLoans = await GoldLoan.findAll({ 
      where: { 
        status: 'Active',
        nextDueDate: twoDaysFromNowStr
      } 
    });
    for (const loan of goldLoans) {
      await this.createNotification({
        customerId: loan.customerId,
        type: 'GOLD_LOAN_INTEREST',
        message: `Reminder: Interest for your Gold Loan ${loan.loanNumber} is due on ${loan.nextDueDate}.`
      });
    }

    return { success: true, count: chitFunds.length + goldLoans.length };
  }
}

module.exports = new NotificationService();
