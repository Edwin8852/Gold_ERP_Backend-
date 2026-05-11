/**
 * WhatsApp Service
 * Integration with WhatsApp Business API (Meta) or Twilio
 */
class WhatsAppService {
  /**
   * Send WhatsApp notification (Simulated)
   * @param {string} mobile - Customer mobile number
   * @param {string} message - Notification message
   */
  async sendWhatsAppNotification(mobile, message) {
    console.log(`--------------------------------------------------`);
    console.log(`[WHATSAPP NOTIFICATION SIMULATION]`);
    console.log(`To: ${mobile}`);
    console.log(`Message: ${message}`);
    console.log(`--------------------------------------------------`);

    // TODO: Integrate Twilio or Meta WhatsApp API
    // Example for Meta API:
    // const response = await axios.post(
    //   `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    //   {
    //     messaging_product: "whatsapp",
    //     to: mobile,
    //     type: "text",
    //     text: { body: message }
    //   },
    //   { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
    // );

    return { success: true, provider: 'Simulated' };
  }

  // Compatibility with existing code
  async sendMessage(phone, message) {
    return this.sendWhatsAppNotification(phone, message);
  }
}

module.exports = new WhatsAppService();
