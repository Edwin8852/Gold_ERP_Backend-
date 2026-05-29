/**
 * SMS Notification Service
 * Handles sending messages to customers via SMS Gateway
 */
const sendSMS = async (phone, message) => {
  try {
    // In production, integrate with Twilio, Vonage, or MSG91
    // Example: await twilioClient.messages.create({ body: message, to: phone, from: 'SDRS' });
    
    console.log(`📡 [SMS GATEWAY] Sending to ${phone}: "${message}"`);
    
    // Simulate successful API response
    return { success: true, messageId: Math.random().toString(36).substr(2, 9) };
  } catch (error) {
    console.error('❌ SMS Gateway Error:', error.message);
    throw error;
  }
};

const sendEMIReminder = async (customerName, phone, amount, dueDate) => {
  const message = `Hello ${customerName}, your EMI of Rs. ${amount} for your Gold Loan is due on ${dueDate}. Please pay to avoid penalties. - SDRS Gold Finance`;
  return await sendSMS(phone, message);
};

module.exports = { sendSMS, sendEMIReminder };
