const cron = require('node-cron');
const goldRateService = require('./modules/goldRates/goldRate.service');
const { GoldLoan, Customer } = require('./models');
const { sendEMIReminder } = require('./shared/utils/sms');

/**
 * Initialize all automated cron jobs
 */
const initCronJobs = () => {
  // 1. Update Gold Rate every 30 minutes
  //    Cron expression: "*/30 * * * *" with timezone option
  cron.schedule('*/30 * * * *', async () => {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.log(`⏰ [Cron] Running Gold Rate Update at ${now} IST ...`);
    try {
      const saved = await goldRateService.fetchAndSaveTodaysRate();
      console.log(`✅ [Cron] Gold Rate saved — 24K: ₹${saved.gold24k}, 22K: ₹${saved.gold22k}, 18K: ₹${saved.gold18k}, Ag: ₹${saved.silverRate} (source: ${saved.source})`);
    } catch (err) {
      console.error(`❌ [Cron] Gold Rate Update failed: ${err.message}`);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  // 2. Scan for EMIs due in 2 days (Run daily at 9:00 AM)
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running EMI Reminder Cron...');
    
    const { Op } = require('sequelize');
    const NotificationService = require('./modules/notification/notification.service');

    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    try {
      const upcomingLoans = await GoldLoan.findAll({
        where: {
          status: 'ACTIVE',
          // Simplified logic: checking if next payment date is in 2 days
          // In real ERP, this would check against an EMI schedule table
        },
        include: [{ model: Customer, as: 'customer' }]
      });

      for (const loan of upcomingLoans) {
        if (loan.customer) {
          // Send SMS
          await sendEMIReminder(
            loan.customer.firstName,
            loan.customer.mobileNumber,
            loan.monthlyInterest || 5000,
            twoDaysFromNow.toLocaleDateString()
          );

          // Create System Notification
          await NotificationService.createNotification({
            customerId: loan.customerId,
            type: 'EMI_REMINDER',
            message: `Friendly reminder: Your loan EMI for ${loan.loanCode || loan.id} is coming up soon.`
          }).catch(err => console.error('Notification Error:', err.message));
        }
      }
    } catch (error) {
      console.error('❌ EMI Cron Error:', error.message);
    }
  });

  // 3. Risk Engine Hook: Check Overdue Payments & Defaults (Run daily at 1:00 AM)
  cron.schedule('0 1 * * *', async () => {
    console.log('⏰ Running Risk Engine Hook Cron...');
    const { Op } = require('sequelize');
    const NotificationService = require('./modules/notification/notification.service');

    try {
      // Find overdue loans
      const overdueLoans = await GoldLoan.findAll({
        where: {
          status: 'ACTIVE',
          dueDate: { [Op.lt]: new Date() } // Past due
        },
        include: [{ model: Customer, as: 'customer' }]
      });

      for (const loan of overdueLoans) {
        if (loan.customer) {
          // Increase Risk Score (meaning higher risk)
          let newRiskScore = loan.customer.riskScore + 5; // Penalty of 5 points
          if (newRiskScore > 100) newRiskScore = 100; // Cap at 100

          await loan.customer.update({ riskScore: newRiskScore, lastRiskUpdate: new Date() });

          // Send Default/Late Payment Alert
          await NotificationService.createNotification({
            customerId: loan.customerId,
            type: 'LATE_PAYMENT',
            message: `URGENT: Your payment for loan ${loan.loanCode || loan.id} is overdue. Please pay immediately.`
          }).catch(err => console.error('Notification Error:', err.message));
        }
      }
    } catch (error) {
      console.error('❌ Risk Engine Cron Error:', error.message);
    }
  });

  console.log('🚀 Automation Cron Jobs Initialized');
};

module.exports = { initCronJobs };
