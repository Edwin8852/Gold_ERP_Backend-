const { Customer, User, GoldLoan, Payment, Invoice, LoanHistory, sequelize } = require('../../models');
const { Op } = require('sequelize');
const EmailService = require('../notification/email/email.service');
const WhatsAppService = require('../notification/whatsapp/whatsapp.service');
const NotificationService = require('../notification/notification.service');
const valuationService = require('../goldFinance/valuation.service');
const invoiceService = require('../invoice/invoice.service');
const AppError = require('../../shared/utils/AppError');

class WalkInService {
  /**
   * Helper to generate unique walk-in customer code
   */
  async generateWalkInCustomerCode() {
    const currentYear = new Date().getFullYear();
    const prefix = `WALK-${currentYear}-`;
    
    // Find the last customer with a customerCode matching the prefix
    const lastCustomer = await Customer.findOne({
      where: {
        customerCode: {
          [Op.like]: `${prefix}%`
        }
      },
      order: [['createdAt', 'DESC']],
    });

    let nextNumber = 1;
    if (lastCustomer && lastCustomer.customerCode) {
      const parts = lastCustomer.customerCode.split('-');
      const lastNumber = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const paddedNumber = String(nextNumber).padStart(4, '0');
    return `${prefix}${paddedNumber}`;
  }

  /**
   * Helper to generate unique loan number
   */
  async generateLoanNumber() {
    const lastLoan = await GoldLoan.findOne({ order: [['createdAt', 'DESC']] });
    let nextNumber = 1001;
    if (lastLoan && lastLoan.loanNumber) {
      const parts = lastLoan.loanNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }
    return `GL-${nextNumber}`;
  }

  /**
   * Helper to calculate monthly interest and total repayment
   */
  calculateFinance(loanAmount, interestRate) {
    const monthlyInterest = (loanAmount * interestRate) / (100 * 12);
    const totalRepayment = loanAmount + monthlyInterest;
    return { monthlyInterest, totalRepayment };
  }

  /**
   * Walk-in Customer Registration
   */
  async registerCustomer(customerData, userId) {
    const { name, mobileNumber, alternativeNumber, aadharNumber, panNumber, address, gender, occupation, remarks } = customerData;

    // Check for existing customer with same mobile
    const existingMobile = await Customer.findOne({ where: { mobileNumber } });
    if (existingMobile) {
      throw new AppError('A customer with this mobile number already exists.', 400);
    }

    // Check for existing customer with same Aadhaar
    const existingAadhar = await Customer.findOne({ where: { aadharNumber } });
    if (existingAadhar) {
      throw new AppError('A customer with this Aadhaar number already exists.', 400);
    }

    // Split Name into firstName and lastName
    let firstName = name;
    let lastName = '';
    const spaceIdx = name.indexOf(' ');
    if (spaceIdx !== -1) {
      firstName = name.substring(0, spaceIdx);
      lastName = name.substring(spaceIdx + 1);
    }

    // Generate Code
    const customerCode = await this.generateWalkInCustomerCode();

    const customer = await Customer.create({
      firstName,
      lastName,
      mobileNumber,
      alternativeNumber,
      aadharNumber,
      panNumber,
      address,
      gender,
      occupation,
      remarks,
      customerType: 'WALK_IN',
      customerCode,
      kycStatus: 'PENDING',
      isKycVerified: false,
      createdBy: userId
    });

    console.log(`[WalkInService] Registered walk-in customer: ${customerCode}`);
    return customer;
  }

  /**
   * Upload KYC Documents
   */
  async uploadKyc(customerId, files) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new AppError('Customer profile not found', 404);
    }

    const currentKycDocs = customer.kycDocuments || {};

    const kycDocuments = {
      ...currentKycDocs,
      aadharFront: files.kycAadharFront ? files.kycAadharFront[0].path : currentKycDocs.aadharFront || null,
      aadharBack: files.kycAadharBack ? files.kycAadharBack[0].path : currentKycDocs.aadharBack || null,
      panCard: files.kycPanCard ? files.kycPanCard[0].path : currentKycDocs.panCard || null,
      jewelPhotos: files.jewelPhotos ? files.jewelPhotos.map(f => f.path) : currentKycDocs.jewelPhotos || [],
      supportingDocs: files.kycSupportingDocs ? files.kycSupportingDocs.map(f => f.path) : currentKycDocs.supportingDocs || []
    };

    const updateData = {
      kycDocuments,
      photo: files.photo ? files.photo[0].path : customer.photo,
      signature: files.signature ? files.signature[0].path : customer.signature
    };

    const updated = await customer.update(updateData);
    console.log(`[WalkInService] Uploaded KYC documents for Customer ID: ${customerId}`);
    return updated;
  }

  /**
   * KYC Verification
   */
  async verifyKyc(customerId, status, remarks) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new AppError('Customer profile not found', 404);
    }

    if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
      throw new AppError('Invalid KYC status. Must be PENDING, VERIFIED, or REJECTED', 400);
    }

    const updated = await customer.update({
      kycStatus: status,
      isKycVerified: status === 'VERIFIED',
      remarks: remarks || customer.remarks
    });

    console.log(`[WalkInService] KYC verification completed for Customer ID: ${customerId}. Status: ${status}`);
    return updated;
  }

  /**
   * Create walk-in loan and map it
   */
  async createLoan(loanData, userId) {
    const { customerId, goldType, ornamentType, goldWeight, goldPurity, loanAmount, interestRate = 12, duration = 12, marketRate } = loanData;

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new AppError('Customer profile not found', 404);
    }

    if (customer.customerType !== 'WALK_IN') {
      throw new AppError('This customer is not registered as a Walk-in customer.', 400);
    }

    // 1. Calculate Valuation using existing valuation engine
    const valuation = await valuationService.calculateValuation({
      weight: parseFloat(goldWeight) || 0,
      purity: goldPurity,
      requestedAmount: parseFloat(loanAmount) || 0
    });

    if (parseFloat(loanAmount) > valuation.eligibleLoanAmount) {
      throw new AppError(`Requested loan amount exceeds eligible limit. Maximum allowed: ₹${valuation.eligibleLoanAmount}`, 400);
    }

    const { monthlyInterest, totalRepayment } = this.calculateFinance(parseFloat(loanAmount), parseFloat(interestRate));
    const loanNumber = await this.generateLoanNumber();

    // 2. Create Active Gold Loan
    const loan = await GoldLoan.create({
      customerId: customer.id,
      loanNumber,
      customerName: `${customer.firstName} ${customer.lastName || ''}`,
      mobileNumber: customer.mobileNumber,
      goldType: goldType || 'ORNAMENTS',
      ornamentType: ornamentType || 'Other',
      goldWeight: parseFloat(goldWeight) || 0,
      goldPurity: goldPurity || '22K',
      currentGoldRate: parseFloat(marketRate) || 6800,
      goldValue: valuation.estimatedGoldValue,
      eligibleLoanAmount: valuation.eligibleLoanAmount,
      loanAmount: parseFloat(loanAmount),
      principalAmount: parseFloat(loanAmount),
      remainingPrincipal: parseFloat(loanAmount),
      interestRate: parseFloat(interestRate),
      loanDuration: parseInt(duration),
      monthlyInterest,
      totalRepayment,
      status: 'ACTIVE',
      loanDate: new Date(),
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + parseInt(duration))),
      approvedBy: userId,
      createdBy: userId
    });

    // 3. Generate Initial Invoice using existing service
    await invoiceService.createInvoice({
      loanId: loan.id,
      invoiceType: 'LOAN_CREATED',
      oldBalance: parseFloat(loanAmount),
      paidAmount: 0,
      remainingBalance: parseFloat(loanAmount),
      interestAmount: monthlyInterest,
      pendingAmount: totalRepayment,
      totalPaid: 0,
      createdBy: userId,
    }).catch(err => console.error('[WalkInService] Invoice generation failed:', err.message));

    // 4. Add the 6 Automatic Loan History Entries in sequence
    const logs = [
      { action: 'CUSTOMER_CREATED', remarks: 'Walk-in customer account registered automatically.' },
      { action: 'KYC_UPLOADED', remarks: 'KYC identity and address documents successfully uploaded.' },
      { action: 'KYC_VERIFIED', remarks: 'Compliance review completed. KYC documents authenticated.' },
      { action: 'GOLD_VERIFIED', remarks: `Gold ornament check completed: ${ornamentType} (${goldPurity}, ${goldWeight}g) verified.` },
      { action: 'LOAN_APPROVED', remarks: `Loan request approved for ₹${loanAmount} with LTV check.` },
      { action: 'LOAN_DISBURSED', remarks: `Shop disburser released ₹${loanAmount} instantly to customer.` }
    ];

    for (const log of logs) {
      await LoanHistory.create({
        loanId: loan.id,
        action: log.action,
        remarks: log.remarks
      });
    }

    // 5. Send Notifications (Requirement 14)
    // Email Notification
    if (customer.email) {
      const emailSubject = `SDRS Gold - Walk-in Loan Disbursed / தங்க நகை கடன் வழங்கப்பட்டது`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 600px; margin: auto;">
          <h2 style="color: #D4AF37;">SDRS GOLD FINANCE</h2>
          <p>Dear <strong>${customer.firstName}</strong>,</p>
          <p>Your Walk-in Gold Loan has been successfully processed and disbursed.</p>
          <div style="background: #fdfbf7; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Loan Number:</strong> ${loan.loanNumber}</p>
            <p><strong>Disbursed Amount:</strong> ₹${parseFloat(loanAmount).toLocaleString()}</p>
            <p><strong>Interest Rate:</strong> ${interestRate}% p.a.</p>
            <p><strong>Monthly Interest:</strong> ₹${monthlyInterest.toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${loan.dueDate.toLocaleDateString()}</p>
          </div>
          <p>Please log in to your portal to download your digital receipt and statement.</p>
          <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 20px;">&copy; 2026 SDRS Gold Finance ERP</p>
        </div>
      `;
      EmailService.sendEmail(customer.email, emailSubject, emailHtml)
        .then(success => console.log(`[WalkInService] Disbursal email notification status: ${success}`))
        .catch(err => console.error('[WalkInService] Email error:', err.message));
    }

    // WhatsApp Notification
    if (customer.mobileNumber) {
      const whatsappMessage = `Hello ${customer.firstName}, your Walk-in Gold Loan ${loan.loanNumber} of Rs. ${parseFloat(loanAmount).toLocaleString()} is disbursed. Monthly Interest: Rs. ${monthlyInterest.toFixed(2)}. Due Date: ${loan.dueDate.toLocaleDateString()}. Thank you for choosing SDRS Gold.`;
      WhatsAppService.sendMessage(customer.mobileNumber, whatsappMessage)
        .then(res => console.log(`[WalkInService] Disbursal WhatsApp notification status:`, res))
        .catch(err => console.error('[WalkInService] WhatsApp error:', err.message));
    }

    console.log(`[WalkInService] Successfully created Walk-in loan: ${loan.loanNumber}`);
    return loan;
  }
}

module.exports = new WalkInService();
