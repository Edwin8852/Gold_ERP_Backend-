const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env

/**
 * Email Service
 * Handles production-level email delivery using Resend or Nodemailer
 */
class EmailService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.resend = this.apiKey && !this.apiKey.includes('re_abcd') ? new Resend(this.apiKey) : null;
    
    // Fallback/Primary Transporter (Nodemailer)
    // Using MAIL_ environment variables as requested by the user
    const host = process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.mailtrap.io';
    const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || 2525);
    
    this.transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465, // True only for 465 SSL, false for 587 STARTTLS
      auth: {
        user: process.env.MAIL_USER || process.env.SMTP_USER,
        pass: process.env.MAIL_PASS || process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Often needed for shared hosting
      }
    });

    this.initialize();
  }

  async initialize() {
    console.log('--------------------------------------------------');
    console.log('[Email Service] ENTERPRISE INITIALIZATION');
    
    if (this.resend && this.apiKey && !this.apiKey.includes('re_abcd')) {
      console.log('[Email Service] Mode: RESEND SDK (Production Ready)');
    } else {
      console.log('[Email Service] Mode: NODEMAILER SMTP (Active Configuration)');
      this.transporter.verify((error) => {
        if (error) console.error('[Email Service] SMTP Verification Failed:', error.message);
        else console.log('[Email Service] SMTP Server Connection: SUCCESS');
      });
    }
    console.log('--------------------------------------------------');
  }

  async sendEmail(to, subject, html) {
    const fromName = "SDRS Gold Finance";
    const fromEmail = process.env.MAIL_FROM || "onboarding@resend.dev";
    const fullFrom = `${fromName} <${fromEmail}>`;
    
    console.log(`[Email Service] REQUEST START: Sending to ${to}`);
    console.log(`[Email Service] PAYLOAD:`, { from: fullFrom, to, subject });

    try {
      if (this.resend) {
        console.log(`[Email Service] DISPATCHING VIA RESEND API...`);
        const { data, error } = await this.resend.emails.send({
          from: fullFrom,
          to: [to],
          subject: subject,
          html: html,
        });

        if (error) {
          console.error(`[Email Service] RESEND API FAILURE:`, error);
          console.error(`[Email Service] ERROR MESSAGE:`, error.message);
          return false;
        }

        console.log(`[Email Service] EMAIL SUCCESS:`, data);
        console.log(`[Email Service] PROVIDER RESPONSE ID: ${data.id}`);
        return true;
      } else {
        console.log(`[Email Service] DISPATCHING VIA NODEMAILER SMTP...`);
        const info = await this.transporter.sendMail({
          from: fullFrom,
          to,
          subject,
          html,
        });
        console.log(`[Email Service] EMAIL SUCCESS:`, info.messageId);
        return true;
      }
    } catch (err) {
      console.error(`--------------------------------------------------`);
      console.error(`[Email Service] CRITICAL SYSTEM FAILURE`);
      console.error(`[Email Service] EXCEPTION:`, err.message);
      if (err.stack) console.error(`[Email Service] STACK TRACE:`, err.stack);
      console.error(`--------------------------------------------------`);
      return false;
    }
  }

  /**
   * Send Welcome Email with Credentials
   */
  async sendWelcomeEmail(customer, credentials) {
    console.log(`[Email Service] COMPOSING: Welcome email for ${customer.customerCode}`);
    
    const subject = 'Welcome to SDRS Gold Finance - Your Account Access';
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">SDRS GOLD FINANCE</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 2px;">JEWELLERY ERP</p>
        </div>
        
        <h2 style="color: #111827; font-size: 20px;">Welcome, ${customer.firstName}!</h2>
        <p>Your enterprise account has been successfully created. You can now access the SDRS Gold Finance portal using the credentials below:</p>
        
        <div style="background: #fdfbf7; padding: 25px; border-radius: 16px; border: 1px solid #fef3c7; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #b45309; font-size: 16px;">Login Credentials</h3>
          <p style="margin: 8px 0;"><strong>Customer ID:</strong> <span style="color: #D4AF37;">${credentials.customerCode}</span></p>
          <p style="margin: 8px 0;"><strong>Mobile/Username:</strong> ${credentials.mobile}</p>
          <p style="margin: 8px 0;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; border: 1px solid #e5e7eb;">${credentials.password}</code></p>
        </div>
        
        <p style="color: #ef4444; font-size: 13px; font-weight: 600;">⚠️ For security, you will be required to change this password on your first login.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">Login to Dashboard</a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center;">This is an automated message. Please do not reply to this email.<br>&copy; 2026 SDRS Gold Finance Jewellery ERP</p>
      </div>
    `;
    return await this.sendEmail(customer.email, subject, html);
  }

  /**
   * Send Professional KYC Upload Request Email in English and Tamil
   */
  async sendKycUploadRequestEmail(customer, message) {
    console.log(`[Email Service] COMPOSING: Professional KYC Upload Request email for ${customer.firstName} in English & Tamil`);
    
    const subject = 'Action Required: Upload KYC Documents / கேஒய்சி ஆவணங்களை பதிவேற்றவும் - SDRS Gold';
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <!-- Gold Header Banner -->
        <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 35px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.15);">SDRS GOLD FINANCE</h1>
          <p style="margin: 5px 0 0 0; font-size: 12px; letter-spacing: 4px; text-transform: uppercase; font-weight: bold; opacity: 0.9;">Professional Jewellery ERP</p>
        </div>
        
        <div style="padding: 30px 25px; background-color: #ffffff;">
          <h2 style="color: #111827; font-size: 20px; margin-top: 0; font-weight: 700; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px;">
            KYC Document Request / கேஒய்சி ஆவணங்கள் தேவைப்படுகிறது
          </h2>
          
          <p style="font-size: 15px; line-height: 1.6; color: #374151;">
            Dear <strong>${customer.firstName} ${customer.lastName || ''}</strong>,<br>
            To complete your profile verification and activate your services, you are requested to upload your KYC documents immediately.
          </p>

          <p style="font-size: 15px; line-height: 1.6; color: #374151; font-style: italic; margin-top: 10px;">
            மதிப்பிற்குரிய <strong>${customer.firstName}</strong>,<br>
            தங்களது கணக்கு விவரங்களை சரிபார்த்து சேவைகளை துவங்க தங்களின் கேஒய்சி (KYC) ஆவணங்களை உடனடியாக பதிவேற்றம் செய்யுமாறு கேட்டுக்கொள்கிறோம்.
          </p>
          
          <!-- Message Card -->
          <div style="background: #fffdf5; padding: 20px; border-radius: 12px; border-left: 4px solid #D4AF37; margin: 25px 0;">
            <p style="margin: 0; font-weight: bold; color: #854d0e; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              Message from Administrator / மேலாளரின் செய்தி:
            </p>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1f2937; font-weight: 600;">
              "${message || 'Please upload clear copies of your Aadhaar Card, PAN Card, and a signature copy to proceed.'}"
            </p>
          </div>

          <!-- Required Documents List -->
          <div style="margin-top: 30px; background: #fdfdfd; border: 1px solid #f3f4f6; border-radius: 12px; padding: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
              Required Documents / தேவைப்படும் ஆவணங்கள்:
            </h3>
            
            <ul style="padding-left: 20px; margin: 0; color: #4b5563; font-size: 14px; line-height: 1.8;">
              <li><strong>Aadhaar Card (Front & Back):</strong> அசல் ஆதார் கார்டின் முன் மற்றும் பின் பகுதி.</li>
              <li><strong>PAN Card:</strong> அசல் பான் கார்டு நகல்.</li>
              <li><strong>Address Proof:</strong> தற்போதைய முகவரி சான்று (if different from Aadhaar).</li>
              <li><strong>Signature Scan:</strong> தங்களது கையொப்ப நகல்.</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 35px 0 15px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); font-size: 15px;">
              Upload Documents / பதிவேற்றவும்
            </a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;" />
          
          <div style="text-align: center; color: #6b7280; font-size: 12px; line-height: 1.6;">
            <p style="margin: 0 0 5px 0;"><strong>SDRS Gold Finance & Jewellery ERP</strong></p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">This is a system generated notification. Please do not reply directly to this mail.</p>
          </div>
        </div>
      </div>
    `;
    return await this.sendEmail(customer.email, subject, html);
  }

  /**
   * Send Professional Gold Loan Pre-Approval Email in English and Tamil
   */
  async sendGoldLoanPreApprovalEmail(customer, message) {
    console.log(`[Email Service] COMPOSING: Professional Gold Loan Pre-Approval email for ${customer.firstName} in English & Tamil`);
    
    const subject = 'Gold Loan Pre-Approved / தங்க நகை கடன் முன் அனுமதி - SDRS Gold';
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <!-- Gold Header Banner -->
        <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 35px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.15);">SDRS GOLD FINANCE</h1>
          <p style="margin: 5px 0 0 0; font-size: 12px; letter-spacing: 4px; text-transform: uppercase; font-weight: bold; opacity: 0.9;">Professional Jewellery ERP</p>
        </div>
        
        <div style="padding: 30px 25px; background-color: #ffffff;">
          <h2 style="color: #111827; font-size: 20px; margin-top: 0; font-weight: 700; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px;">
            Gold Loan Pre-Approval / தங்க நகை கடன் முன் அனுமதி
          </h2>
          
          <p style="font-size: 15px; line-height: 1.6; color: #374151;">
            Dear <strong>${customer.firstName} ${customer.lastName || ''}</strong>,<br>
            We are pleased to inform you that your online gold loan request has been successfully pre-approved by our administrator. Please find the details and next steps below.
          </p>

          <p style="font-size: 15px; line-height: 1.6; color: #374151; font-style: italic; margin-top: 10px;">
            மதிப்பிற்குரிய <strong>${customer.firstName}</strong>,<br>
            தங்களின் ஆன்லைன் தங்க நகை கடன் விண்ணப்பம் எங்களது மேலாளரால் சரிபார்க்கப்பட்டு வெற்றிகரமாக முன் அனுமதி வழங்கப்பட்டுள்ளது என்பதை மகிழ்ச்சியுடன் தெரிவித்துக் கொள்கிறோம்.
          </p>
          
          <!-- English Notification Card -->
          <div style="background: #fffdf5; padding: 20px; border-radius: 12px; border-left: 4px solid #D4AF37; margin: 25px 0;">
            <p style="margin: 0; font-weight: bold; color: #854d0e; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              🇬🇧 English Instruction
            </p>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1f2937; font-weight: 600;">
              "${message}"
            </p>
          </div>

          <!-- Tamil Notification Card -->
          <div style="background: #f9fbfd; padding: 20px; border-radius: 12px; border-left: 4px solid #2563eb; margin: 25px 0;">
            <p style="margin: 0; font-weight: bold; color: #1e3a8a; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              🇮🇳 தமிழ் அறிவிப்பு (Tamil Instruction)
            </p>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1e293b; font-weight: 600;">
              "தங்களின் நகைக் கடன் செயல்முறை வெற்றிகரமாக முடிந்தது! தயவுசெய்து தங்களின் தங்க நகைகளுடன் எங்களது கடைக்கு வந்து தங்களுக்குரிய பணத்தைப் பெற்றுக் கொள்ளுமாறு கேட்டுக்கொள்கிறோம்."
            </p>
          </div>

          <!-- Next Steps Section -->
          <div style="margin-top: 30px; background: #fdfdfd; border: 1px solid #f3f4f6; border-radius: 12px; padding: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
              Steps to Collect Your Cash / பணத்தைப் பெற எளிய வழிமுறைகள்:
            </h3>
            
            <ul style="padding-left: 20px; margin: 0; color: #4b5563; font-size: 14px; line-height: 1.8;">
              <li><strong>Bring Your Gold:</strong> Visit our shop with the gold ornaments/jewellery you listed in the application. (தங்களின் தங்க நகைகளை கடைக்கு கொண்டு வரவும்)</li>
              <li><strong>Purity & Weight Check:</strong> Our experts will run a secure physical valuation in your presence. (நகையின் தரம் மற்றும் எடை தங்களின் முன்னிலையில் சரிபார்க்கப்படும்)</li>
              <li><strong>Instant Disbursal:</strong> Collect the cash immediately or receive it as a direct bank transfer. (உடனடியாக ரொக்கமாகவோ அல்லது வங்கி கணக்கிலோ பெற்றுக்கொள்ளலாம்)</li>
              <li><strong>Documents:</strong> Please carry a valid original ID proof (Aadhaar Card, PAN Card, etc.). (அசல் அடையாள அட்டை ஒன்றை கொண்டு வரவும்)</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 35px 0 15px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); font-size: 15px;">
              View Loan Status / விவரங்களை பார்க்க
            </a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;" />
          
          <div style="text-align: center; color: #6b7280; font-size: 12px; line-height: 1.6;">
            <p style="margin: 0 0 5px 0;"><strong>SDRS Gold Finance & Jewellery ERP</strong></p>
            <p style="margin: 0 0 15px 0;">Customer support is available at our branch office during regular business hours.</p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">This is a system generated notification. Please do not reply directly to this mail.</p>
          </div>
        </div>
      </div>
    `;
    return await this.sendEmail(customer.email, subject, html);
  }
}

module.exports = new EmailService();



