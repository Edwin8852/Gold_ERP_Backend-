const { ChitInstallment, ChitSubscriber, Customer, sequelize } = require('../../models');
const { Op } = require('sequelize');
const NotificationService = require('../notification/notification.service');

class ChitFundAutomationService {
  /**
   * Process and send reminders for upcoming chit installments
   * Requirement: Send reminder 2 days before due date
   */
  async processUpcomingReminders() {
    console.log('[Chit Automation] Starting upcoming reminders job...');
    
    try {
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      
      const startDate = new Date(twoDaysFromNow.setHours(0,0,0,0));
      const endDate = new Date(twoDaysFromNow.setHours(23,59,59,999));

      const upcomingInstallments = await ChitInstallment.findAll({
        where: {
          dueDate: { [Op.between]: [startDate, endDate] },
          status: 'PENDING'
        },
        include: [{ 
          model: ChitSubscriber, 
          as: 'subscriber',
          include: [{ model: Customer, as: 'customer' }]
        }]
      });

      console.log(`[Chit Automation] Found ${upcomingInstallments.length} installments due in 2 days.`);

      let sentCount = 0;
      for (const installment of upcomingInstallments) {
        if (installment.subscriber?.customer) {
          await NotificationService.createNotification({
            customerId: installment.subscriber.customerId,
            type: 'CHIT_DUE_REMINDER',
            message: `Reminder: Your chit fund monthly payment due date is approaching. Please complete your payment of ₹${parseFloat(installment.payableAmount).toLocaleString()} before ${new Date(installment.dueDate).toLocaleDateString()}.`,
            metadata: {
              installmentId: installment.id,
              dueDate: installment.dueDate,
              amount: installment.payableAmount
            }
          });
          sentCount++;
        }
      }

      console.log(`[Chit Automation] Reminders job completed. Sent ${sentCount} notifications.`);
      return sentCount;
    } catch (error) {
      console.error('[Chit Automation] Reminders job failed:', error.message);
      throw error;
    }
  }

  /**
   * Clean up and mark overdue installments WITHOUT penalties
   * Just updates status to 'PENDING' or similar, but the user said "NO overdue charges".
   * I'll just leave them as PENDING or mark as 'PENDING_DUE' to avoid 'OVERDUE' stigma.
   */
  async updateInstallmentStatuses() {
    console.log('[Chit Automation] Updating installment statuses...');
    // Just a placeholder to ensure we don't have penalty logic here anymore.
    // The user wants purely savings based.
  }
}

module.exports = new ChitFundAutomationService();
