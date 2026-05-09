const EmailService = require('./email/email.service');
const WhatsAppService = require('./whatsapp/whatsapp.service');
const templates = require('./templates/notification.templates');

/**
 * Unified Notification Service
 */
class NotificationService {
  async notifyCustomerRegistration(email, phone, name) {
    const template = templates.WELCOME_CUSTOMER(name);
    
    // Send via multiple channels
    await EmailService.sendEmail(email, template.subject, template.body);
    await WhatsAppService.sendMessage(phone, template.body);
  }

  async notifyOrderPlaced(email, phone, orderNo, amount) {
    const template = templates.ORDER_CONFIRMATION(orderNo, amount);
    
    await EmailService.sendEmail(email, template.subject, template.body);
    await WhatsAppService.sendMessage(phone, template.body);
  }

  // Generic send method for custom notifications
  async sendCustom(email, phone, subject, message) {
    if (email) await EmailService.sendEmail(email, subject, message);
    if (phone) await WhatsAppService.sendMessage(phone, message);
  }
}

module.exports = new NotificationService();
