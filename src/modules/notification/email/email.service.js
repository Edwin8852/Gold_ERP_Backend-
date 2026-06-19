const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const dotenv = require('dotenv');
const fs = require('fs');
const { generateEmailCard } = require('../../../shared/templates/emailCardTemplate');
const { Notification } = require('../../../models');
dotenv.config();

class EmailService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.resend = this.apiKey && !this.apiKey.includes('re_abcd') ? new Resend(this.apiKey) : null;
    
    const host = process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.mailtrap.io';
    const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || 2525);
    
    this.transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      auth: {
        user: process.env.MAIL_USER || process.env.SMTP_USER,
        pass: process.env.MAIL_PASS || process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    this.initialize();
  }

  async initialize() {
    console.log('--------------------------------------------------');
    console.log('[Email Service] ENTERPRISE INITIALIZATION (Multilingual)');
    if (this.resend && this.apiKey && !this.apiKey.includes('re_abcd')) {
      console.log('[Email Service] Mode: RESEND SDK (Production Ready)');
    } else {
      console.log('[Email Service] Mode: NODEMAILER SMTP (Active Configuration)');
    }
    console.log('--------------------------------------------------');
  }

  async sendEmail(to, subject, html, attachments = []) {
    const fromName = "SDRS Gold Finance";
    const fromEmail = process.env.MAIL_FROM || "onboarding@resend.dev";
    const fullFrom = `${fromName} <${fromEmail}>`;
    
    try {
      if (this.resend) {
        const { error } = await this.resend.emails.send({
          from: fullFrom,
          to: [to],
          subject: subject,
          html: html,
          attachments: attachments
        });
        if (error) return false;
        return true;
      } else {
        await this.transporter.sendMail({
          from: fullFrom,
          to,
          subject,
          html,
          attachments
        });
        return true;
      }
    } catch (err) {
      console.error(`[Email Service] EXCEPTION:`, err.message);
      return false;
    }
  }

  async _createDashboardNotification(customerId, type, enMessage, taMessage, language) {
    if (!customerId) return;
    try {
      const message = language === 'ta' ? taMessage : enMessage;
      await Notification.create({
        customerId,
        type,
        message,
        isRead: false
      });
    } catch (error) {
      console.error('[Email Service] Failed to create dashboard notification:', error.message);
    }
  }

  // 1. Customer Registration
  async sendWelcomeEmail(customer, credentials) {
    if (!customer || !customer.email) return false;
    const lang = customer.preferredLanguage || 'en';
    const isTa = lang === 'ta';

    const title = isTa ? 'SDRS கோல்டு பைனான்ஸ்க்கு வரவேற்கிறோம்' : 'Welcome to SDRS Gold Finance';
    
    const content = isTa ? `
      <p>SDRS Gold Finance குடும்பத்தில் உங்களை அன்புடன் வரவேற்கிறோம்.</p>
      <p>உங்கள் கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டுள்ளது.</p>
      <p><strong>வாடிக்கையாளர் குறியீடு:</strong><br/>${customer.customerCode}</p>
      <p>தற்காலிக கடவுச்சொல்: <strong>${credentials?.password || '***'}</strong></p>
    ` : `
      <p>Welcome to SDRS Gold Finance.</p>
      <p>Your account has been created successfully.</p>
      <p><strong>Customer Code:</strong><br/>${customer.customerCode}</p>
      <p>Temporary Password: <strong>${credentials?.password || '***'}</strong></p>
    `;

    const html = generateEmailCard({
      title,
      customerName: customer.firstName,
      content,
      language: lang
    });

    const success = await this.sendEmail(customer.email, title, html);
    if (success) {
      await this._createDashboardNotification(customer.id, 'ACCOUNT_CREATED', 
        `Welcome to SDRS Gold Finance. Your account is created successfully. Customer Code: ${customer.customerCode}`,
        `SDRS Gold Finance குடும்பத்தில் உங்களை அன்புடன் வரவேற்கிறோம். உங்கள் கணக்கு உருவாக்கப்பட்டுள்ளது. குறியீடு: ${customer.customerCode}`,
        lang
      );
    }
    return success;
  }

  // 2. Gold Loan Approved (Pre-Approval included)
  async sendGoldLoanPreApprovalEmail(customer, loanNumber, amount) {
    if (!customer || !customer.email) return false;
    const lang = customer.preferredLanguage || 'en';
    const isTa = lang === 'ta';

    const title = isTa ? 'தங்க கடன் ஒப்புதல் பெறப்பட்டுள்ளது' : 'Gold Loan Approved';
    
    const content = isTa ? `
      <p>உங்கள் தங்க கடன் ஒப்புதல் பெறப்பட்டுள்ளது.</p>
      <p><strong>கடன் எண்:</strong><br/>${loanNumber}</p>
      <p><strong>கடன் தொகை:</strong><br/>₹${amount}</p>
    ` : `
      <p>Your Gold Loan has been approved.</p>
      <p><strong>Loan Number:</strong><br/>${loanNumber}</p>
      <p><strong>Loan Amount:</strong><br/>₹${amount}</p>
    `;

    const html = generateEmailCard({
      title,
      customerName: customer.firstName,
      content,
      referenceNumber: loanNumber,
      language: lang
    });

    const success = await this.sendEmail(customer.email, title, html);
    if (success) {
      await this._createDashboardNotification(customer.id, 'LOAN_APPROVED', 
        `Your Gold Loan has been approved. Loan Number: ${loanNumber}, Amount: ₹${amount}`,
        `உங்கள் தங்க கடன் ஒப்புதல் பெறப்பட்டுள்ளது. கடன் எண்: ${loanNumber}, தொகை: ₹${amount}`,
        lang
      );
    }
    return success;
  }

  // 3. Payment Received
  async sendPaymentReceiptEmail(customer, amount, invoiceNumber, invoice) {
    if (!customer || !customer.email) return false;
    const lang = customer.preferredLanguage || 'en';
    const isTa = lang === 'ta';

    const title = isTa ? 'பணம் வெற்றிகரமாக பெறப்பட்டது' : 'Payment Received Successfully';
    
    const content = isTa ? `
      <p style="margin-bottom: 20px;">உங்கள் பணம் வெற்றிகரமாக பெறப்பட்டது.</p>
      <ul style="padding-left: 20px; line-height: 1.8;">
        <li><strong>ரசீது எண்:</strong> ${invoiceNumber}</li>
        <li><strong>தொகை:</strong> ₹${amount}</li>
      </ul>
    ` : `
      <p style="margin-bottom: 20px;">Payment received successfully.</p>
      <ul style="padding-left: 20px; line-height: 1.8;">
        <li><strong>Receipt Number:</strong> ${invoiceNumber}</li>
        <li><strong>Amount:</strong> ₹${amount}</li>
      </ul>
    `;

    const html = generateEmailCard({
      title,
      content,
      language: lang
    });

    let attachments = [];
    if (invoice && invoice.pdfPath && fs.existsSync(invoice.pdfPath)) {
      attachments.push({ filename: `Receipt-${invoiceNumber}.pdf`, path: invoice.pdfPath, contentType: 'application/pdf' });
    }

    const success = await this.sendEmail(customer.email, title, html, attachments);
    if (success) {
      await this._createDashboardNotification(customer.id, 'PAYMENT_RECEIVED', 
        `Payment received successfully. Amount: ₹${amount}`,
        `உங்கள் பணம் வெற்றிகரமாக பெறப்பட்டது. தொகை: ₹${amount}`,
        lang
      );
    }
    return success;
  }

  // 4. Ready For Closure
  async sendReadyForClosureEmail(customer, loanNumber) {
    if (!customer || !customer.email) return false;
    const lang = customer.preferredLanguage || 'en';
    const isTa = lang === 'ta';

    const title = isTa ? 'கடன் முடிப்பதற்கு தயார்' : 'Ready For Closure';
    
    const content = isTa ? `
      <p style="margin-bottom: 10px;">உங்கள் கடன் முழுமையாக செலுத்தப்பட்டுள்ளது.</p>
      <p><strong>கடன் எண்:</strong> ${loanNumber}</p>
      <p style="margin-top: 10px;">கடன் முடிப்பதற்கு தயார் நிலையில் உள்ளது.</p>
    ` : `
      <p style="margin-bottom: 10px;">Your loan has been fully repaid and is ready for closure.</p>
      <p><strong>Loan Number:</strong> ${loanNumber}</p>
    `;

    const html = generateEmailCard({
      title,
      content,
      language: lang
    });

    const success = await this.sendEmail(customer.email, title, html);
    if (success) {
      await this._createDashboardNotification(customer.id, 'READY_FOR_CLOSURE', 
        `Your loan ${loanNumber} has been fully repaid and is ready for closure.`,
        `உங்கள் கடன் ${loanNumber} முழுமையாக செலுத்தப்பட்டுள்ளது. கடன் முடிப்பதற்கு தயார் நிலையில் உள்ளது.`,
        lang
      );
    }
    return success;
  }

  // 5. Loan Closed
  async sendLoanClosureEmail(customer, loan, invoice) {
    if (!customer || !customer.email) return false;
    const lang = customer.preferredLanguage || 'en';
    const isTa = lang === 'ta';

    const title = isTa ? 'தங்க கடன் வெற்றிகரமாக முடிக்கப்பட்டுள்ளது' : 'Gold Loan Closed';
    
    const closureDateStr = new Date().toLocaleDateString(isTa ? 'ta-IN' : 'en-IN');
    
    const content = isTa ? `
      <p style="margin-bottom: 20px;">தங்களின் தங்கக் கடன் வெற்றிகரமாக முடிக்கப்பட்டுள்ளது.</p>
      
      <p style="margin: 0; font-weight: 600;">கடன் விவரங்கள்:</p>
      <ul style="margin-top: 5px; padding-left: 20px; line-height: 1.8;">
        <li><strong>கடன் எண்:</strong> ${loan.loanNumber}</li>
        <li><strong>வாடிக்கையாளர் பெயர்:</strong> ${customer.firstName}</li>
        <li><strong>கடன் தொகை:</strong> ₹${loan.loanAmount}</li>
        <li><strong>செலுத்திய மொத்த தொகை:</strong> ₹${loan.totalPaid}</li>
        <li><strong>கடன் முடிப்பு தேதி:</strong> ${closureDateStr}</li>
      </ul>

      <p style="margin-top: 20px; margin-bottom: 20px;">தங்களின் அனைத்து நிலுவைத் தொகைகளும் முழுமையாக செலுத்தப்பட்டுள்ளன.</p>
      
      <p style="margin: 0; font-weight: 600;">அடுத்த கட்டம்:</p>
      <p style="margin-top: 5px;">தங்களின் அடகு வைத்த நகையை எங்கள் கிளையில் பெற்றுக்கொள்ளலாம்.</p>
      
      <p style="margin-top: 20px; font-weight: 600;">SDRS Gold Finance நிறுவனத்தைத் தேர்வு செய்ததற்கு நன்றி.</p>
    ` : `
      <p style="margin-bottom: 20px;">Your Gold Loan has been successfully closed.</p>
      
      <p style="margin: 0; font-weight: 600;">Loan Details:</p>
      <ul style="margin-top: 5px; padding-left: 20px; line-height: 1.8;">
        <li><strong>Loan Number:</strong> ${loan.loanNumber}</li>
        <li><strong>Customer Name:</strong> ${customer.firstName}</li>
        <li><strong>Loan Amount:</strong> ₹${loan.loanAmount}</li>
        <li><strong>Total Paid:</strong> ₹${loan.totalPaid}</li>
        <li><strong>Closure Date:</strong> ${closureDateStr}</li>
      </ul>

      <p style="margin-top: 20px; margin-bottom: 20px;">We are pleased to inform you that all outstanding dues have been cleared successfully.</p>
      
      <p style="margin: 0; font-weight: 600;">Next Step:</p>
      <p style="margin-top: 5px;">Your pledged ornament is now eligible for release from our branch.</p>
      
      <p style="margin-top: 20px; font-weight: 600;">Thank you for choosing SDRS Gold Finance.</p>
    `;

    const html = generateEmailCard({
      title,
      content,
      language: lang
    });

    let attachments = [];
    if (invoice && invoice.pdfPath && fs.existsSync(invoice.pdfPath)) {
      attachments.push({ filename: `Closure-${invoice.invoiceNumber}.pdf`, path: invoice.pdfPath, contentType: 'application/pdf' });
    }

    const success = await this.sendEmail(customer.email, title, html, attachments);
    if (success) {
      await this._createDashboardNotification(customer.id, 'LOAN_CLOSED', 
        `Your Gold Loan ${loan.loanNumber} has been successfully closed.`,
        `உங்கள் தங்க கடன் ${loan.loanNumber} வெற்றிகரமாக முடிக்கப்பட்டுள்ளது.`,
        lang
      );
    }
    return success;
  }

  // 6. Ornament Released
  async sendOrnamentReleaseEmail(customer, loan, invoice) {
    if (!customer || !customer.email) return false;
    const lang = customer.preferredLanguage || 'en';
    const isTa = lang === 'ta';

    const title = isTa ? 'நகை வெற்றிகரமாக வழங்கப்பட்டுள்ளது' : 'Ornament Released Successfully';
    
    const content = isTa ? `
      <p style="margin-bottom: 10px;">அடமானமாக வைக்கப்பட்ட நகை வெற்றிகரமாக வழங்கப்பட்டுள்ளது.</p>
      <p><strong>கடன் எண்:</strong> ${loan.loanNumber}</p>
    ` : `
      <p style="margin-bottom: 10px;">Your pledged ornament has been released successfully.</p>
      <p><strong>Loan Number:</strong> ${loan.loanNumber}</p>
    `;

    const html = generateEmailCard({
      title,
      content,
      language: lang
    });

    let attachments = [];
    if (invoice && invoice.pdfPath && fs.existsSync(invoice.pdfPath)) {
      attachments.push({ filename: `Release-${invoice.invoiceNumber}.pdf`, path: invoice.pdfPath, contentType: 'application/pdf' });
    }

    const success = await this.sendEmail(customer.email, title, html, attachments);
    if (success) {
      await this._createDashboardNotification(customer.id, 'ORNAMENT_RELEASED', 
        `Your pledged ornament for loan ${loan.loanNumber} has been released successfully.`,
        `கடன் ${loan.loanNumber} - அடமானமாக வைக்கப்பட்ட நகை வெற்றிகரமாக வழங்கப்பட்டுள்ளது.`,
        lang
      );
    }
    return success;
  }

  // 7. Chit Fund Payment
  async sendChitFundPaymentEmail(customer, amount, schemeName) {
    if (!customer || !customer.email) return false;
    const lang = customer.preferredLanguage || 'en';
    const isTa = lang === 'ta';

    const title = isTa ? 'சீட்டு தொகை பெறப்பட்டது' : 'Chit Fund Payment Received';
    
    const content = isTa ? `
      <p>உங்கள் சீட்டு தொகை வெற்றிகரமாக பெறப்பட்டுள்ளது.</p>
      <p><strong>தொகை:</strong><br/>₹${amount}</p>
      <p><strong>திட்டம்:</strong><br/>${schemeName}</p>
    ` : `
      <p>Your Chit Fund payment has been received.</p>
      <p><strong>Amount:</strong><br/>₹${amount}</p>
      <p><strong>Scheme:</strong><br/>${schemeName}</p>
    `;

    const html = generateEmailCard({
      title,
      customerName: customer.firstName,
      content,
      language: lang
    });

    const success = await this.sendEmail(customer.email, title, html);
    if (success) {
      await this._createDashboardNotification(customer.id, 'CHIT_PAYMENT_RECEIVED', 
        `Your Chit Fund payment of ₹${amount} for ${schemeName} has been received.`,
        `${schemeName} திட்டத்திற்கான உங்கள் சீட்டு தொகை ₹${amount} வெற்றிகரமாக பெறப்பட்டுள்ளது.`,
        lang
      );
    }
    return success;
  }

  // 8. Jewelry Order Created
  async sendJewelryOrderCreatedEmail(customer, orderNumber) {
    if (!customer || !customer.email) return false;
    const lang = customer.preferredLanguage || 'en';
    const isTa = lang === 'ta';

    const title = isTa ? 'நகை ஆர்டர் பதிவு செய்யப்பட்டுள்ளது' : 'Jewelry Order Created';
    
    const content = isTa ? `
      <p style="margin-bottom: 10px;">உங்கள் நகை ஆர்டர் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது.</p>
      <p><strong>ஆர்டர் எண்:</strong> ${orderNumber}</p>
    ` : `
      <p style="margin-bottom: 10px;">Your Jewelry Order has been placed successfully.</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
    `;

    const html = generateEmailCard({
      title,
      content,
      language: lang
    });

    const success = await this.sendEmail(customer.email, title, html);
    if (success) {
      await this._createDashboardNotification(customer.id, 'ORDER_CREATED', 
        `Your Jewelry Order ${orderNumber} has been placed successfully.`,
        `உங்கள் நகை ஆர்டர் ${orderNumber} வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது.`,
        lang
      );
    }
    return success;
  }

  // 9. Jewelry Ready For Delivery
  async sendJewelryReadyForDeliveryEmail(customer, orderNumber) {
    if (!customer || !customer.email) return false;
    const lang = customer.preferredLanguage || 'en';
    const isTa = lang === 'ta';

    const title = isTa ? 'நகை வழங்க தயாராக உள்ளது' : 'Jewelry Ready For Delivery';
    
    const content = isTa ? `
      <p style="margin-bottom: 10px;">உங்கள் நகை ஆர்டர் வழங்க தயாராக உள்ளது.</p>
      <p><strong>ஆர்டர் எண்:</strong> ${orderNumber}</p>
    ` : `
      <p style="margin-bottom: 10px;">Your Jewelry Order is ready for delivery.</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
    `;

    const html = generateEmailCard({
      title,
      content,
      language: lang
    });

    const success = await this.sendEmail(customer.email, title, html);
    if (success) {
      await this._createDashboardNotification(customer.id, 'ORDER_READY_FOR_DELIVERY', 
        `Your Jewelry Order ${orderNumber} is ready for delivery.`,
        `உங்கள் நகை ஆர்டர் ${orderNumber} வழங்க தயாராக உள்ளது.`,
        lang
      );
    }
    return success;
  }

  // Backwards compatibility for existing NotificationService calls
  async sendKycUploadRequestEmail(customer, message) {
    if (!customer || !customer.email) return false;
    const lang = customer.preferredLanguage || 'en';
    const isTa = lang === 'ta';

    const title = isTa ? 'கேஒய்சி ஆவணங்கள் தேவை' : 'KYC Document Request';
    const content = isTa ? `
      <p>தங்களது கணக்கு விவரங்களை சரிபார்க்க, தங்களின் கேஒய்சி ஆவணங்களை உடனடியாக பதிவேற்றம் செய்யுமாறு கேட்டுக்கொள்கிறோம்.</p>
      <p><strong>செய்தி:</strong> "${message || 'ஆதார், பான் மற்றும் கையொப்ப நகலை தெளிவாக பதிவேற்றவும்.'}"</p>
    ` : `
      <p>To complete your profile verification, please upload your KYC documents.</p>
      <p><strong>Message:</strong> "${message || 'Please upload clear copies of Aadhaar, PAN, and signature.'}"</p>
    `;

    const html = generateEmailCard({
      title,
      customerName: customer.firstName,
      content,
      language: lang
    });

    return await this.sendEmail(customer.email, title, html);
  }

  // Generic backward compatibility
  async sendAccountApprovalEmail(customer) {
    return await this.sendWelcomeEmail(customer, null);
  }
}

module.exports = new EmailService();
