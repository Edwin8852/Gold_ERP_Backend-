const cron = require('node-cron');
const NotificationService = require('./notification.service');

/**
 * Notification Cron Scheduler
 * SDRS Gold Finance & Jewelry ERP System
 */
const initNotificationCron = () => {
  /**
   * Run daily at 9:00 AM and 6:00 PM
   * Expression: 0 9,18 * * *
   */
  cron.schedule('0 9,18 * * *', async () => {
    console.log('[CRON] Running scheduled notification check at:', new Date().toLocaleString());
    try {
      const result = await NotificationService.generateAutomatedReminders();
      console.log('[CRON] Notification generation complete:', result);
    } catch (error) {
      console.error('[CRON] Error during notification generation:', error);
    }
  });

  console.log('[CRON] Notification scheduler initialized (9 AM, 6 PM)');
};

module.exports = initNotificationCron;
