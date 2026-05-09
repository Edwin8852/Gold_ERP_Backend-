/**
 * Notification Templates
 * Centralized store for all message formats
 */
const templates = {
  WELCOME_CUSTOMER: (name) => ({
    subject: 'Welcome to SDRS Gold Finance',
    body: `Hello ${name}, thank you for registering with us!`,
  }),
  ORDER_CONFIRMATION: (orderNo, amount) => ({
    subject: 'Order Confirmed',
    body: `Your order ${orderNo} for amount ₹${amount} has been successfully placed.`,
  }),
  CHIT_FUND_REMINDER: (schemeName, amount) => ({
    subject: 'Payment Reminder',
    body: `Your installment for ${schemeName} of ₹${amount} is due soon.`,
  }),
};

module.exports = templates;
