/**
 * Email Service
 * Integration with Nodemailer or SendGrid
 */
class EmailService {
  async sendEmail(to, subject, body) {
    console.log(`[Email Sent] To: ${to} | Subject: ${subject}`);
    // Real Implementation:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({ from, to, subject, text: body });
    return true;
  }
}

module.exports = new EmailService();
