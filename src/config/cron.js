const cron = require('node-cron');
const ChitFundAutomationService = require('../modules/chitFund/chitFund.automation');

/**
 * Background Jobs Configuration
 */
const initCronJobs = () => {
  console.log('[Cron] Initializing scheduled jobs...');

  // Run Chit Fund Reminder Check every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      await ChitFundAutomationService.processUpcomingReminders();
    } catch (error) {
      console.error('[Cron] Error in Chit Fund Reminder Job:', error.message);
    }
  });

  console.log('[Cron] Scheduled: Chit Fund Payment Reminders (Daily at 00:00)');
};

module.exports = initCronJobs;
