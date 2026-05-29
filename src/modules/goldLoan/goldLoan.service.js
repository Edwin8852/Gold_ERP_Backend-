const { GoldLoan, GoldLoanScheme, Customer, User, Invoice, LoanLedger, LoanHistory, sequelize } = require('../../models');
const { Op } = require('sequelize');
const valuationService = require('./valuation.service');
const eligibilityService = require('./eligibility.service');
const interestService = require('./interest.service');
const riskService = require('./risk.service');
const securityService = require('../../shared/services/security.service');
const notificationService = require('../notification/notification.service');

class GoldLoanService {
  async _getCustomerByUserId(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
    if (!customer) throw new Error('Customer profile not found for this user');
    return customer;
  }

  async applyLoan(data, userId) {
    console.log(`[GoldLoanService] Processing simple loan application for User: ${userId}`);
    
    try {
      const goldPurity = data.goldPurity || '22K';
      const goldWeight = parseFloat(data.goldWeight) || 0;
      const requestedAmount = parseFloat(data.requestedAmount) || 0;
      const ornamentType = data.ornamentType || 'Other';
      const goldType = data.goldType || 'ORNAMENTS';
      const jewelryDetails = data.jewelryDetails || '';
      const jewelryImages = data.jewelryImages || [];
      const remarks = data.remarks || '';

      const customer = await this._getCustomerByUserId(userId);

      // Create Loan Request (Simple)
      const loan = await GoldLoan.create({
        loanNumber: `GL-${Date.now()}`,
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName || ''}`,
        mobileNumber: customer.mobileNumber,
        goldPurity,
        goldWeight: parseFloat(goldWeight) || 0,
        goldType,
        ornamentType,
        jewelryDetails,
        jewelryImages,
        loanAmount: parseFloat(requestedAmount) || 0,
        principalAmount: 0,
        remainingPrincipal: 0,
        status: 'PENDING_APPROVAL',
        remarks,
        createdBy: userId,
        loanDate: new Date(),
      });

      console.log('[GoldLoanService] Loan Request Submitted Successfully:', loan.id);
      
      await securityService.logAction(userId, 'LOAN_REQUEST_SUBMITTED', 'GOLD_LOAN', loan.id, null, loan.toJSON());

      // Notify Customer
      await notificationService.createNotification({
        customerId: customer.id,
        type: 'GOLD_LOAN_SUBMITTED',
        message: `Your gold loan request ${loan.loanNumber} for ₹${requestedAmount} has been submitted. Please visit our branch for physical gold validation.`
      }).catch(err => console.error('[Notification Error] Failed to send submission alert:', err.message));

      return loan;
    } catch (error) {
      console.error('[GoldLoanService] Application Error:', error);
      throw error;
    }
  }

  async getMyLoans(userId) {
    const customer = await this._getCustomerByUserId(userId);
    return await GoldLoan.findAll({ 
      where: { customerId: customer.id },
      order: [['createdAt', 'DESC']]
    });
  }

  async getPendingLoans() {
    return await GoldLoan.findAll({ 
      where: { status: 'PENDING_APPROVAL' },
      include: [{ 
        model: Customer, 
        as: 'customer', 
        attributes: ['firstName', 'lastName', 'mobileNumber', 'customerCode'] 
      }],
      order: [['createdAt', 'DESC']]
    });
  }

  async approveLoan(loanId, adminId, adminData = {}) {
    const { 
      currentGoldRate, 
      validatedGoldWeight, 
      approvedAmount, 
      interestRate = 12, 
      loanDuration = 12,
      remarks 
    } = adminData;

    const loan = await GoldLoan.findByPk(loanId, {
      include: [{ model: Customer, as: 'customer' }]
    });

    if (!loan) throw new Error('Loan not found');
    
    // 1. Calculate Valuation
    const goldValue = parseFloat(validatedGoldWeight) * parseFloat(currentGoldRate);
    
    // 2. Calculate Interest
    const monthlyInterest = (approvedAmount * (interestRate / 100)) / 12;
    const totalInterest = monthlyInterest * loanDuration;
    const totalRepayment = parseFloat(approvedAmount) + totalInterest;

    // 3. Set Due Date
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + parseInt(loanDuration));

    const oldData = loan.toJSON();
    
    const updatedLoan = await loan.update({ 
      status: 'ACTIVE', 
      approvedBy: adminId,
      currentGoldRate,
      validatedGoldWeight,
      goldValue,
      approvedAmount,
      loanAmount: approvedAmount, // Finalized loan amount
      principalAmount: approvedAmount,
      remainingPrincipal: approvedAmount,
      interestRate,
      loanDuration,
      monthlyInterest,
      totalRepayment,
      dueDate,
      remarks: remarks || loan.remarks,
    });

    // 4. Generate Invoice
    await Invoice.create({
      loanId: loan.id,
      invoiceNumber: `INV-GL-${Date.now()}`,
      invoiceType: 'LOAN_CREATED',
      oldBalance: 0,
      paidAmount: 0,
      remainingBalance: approvedAmount,
      interestAmount: monthlyInterest,
      pendingAmount: approvedAmount,
      totalPaid: 0,
      createdBy: adminId
    }).catch(err => console.error('[Invoice Error] Failed to generate loan invoice:', err.message));

    await securityService.logAction(adminId, 'LOAN_APPROVED_AND_ACTIVE', 'GOLD_LOAN', loan.id, oldData, updatedLoan.toJSON());

    // 5. Notify Customer
    await notificationService.createNotification({
      customerId: loan.customerId,
      type: 'GOLD_LOAN_APPROVED',
      message: `Your gold loan ${loan.loanNumber} is approved and ₹${approvedAmount} has been disbursed. Monthly interest: ₹${monthlyInterest.toFixed(2)}. Due date: ${dueDate.toLocaleDateString()}.`
    }).catch(err => console.error('[Notification Error] Failed to send approval alert:', err.message));

    return updatedLoan;
  }

  async rejectLoan(loanId, adminId, adminData = {}) {
    const { remarks } = adminData;
    const loan = await GoldLoan.findByPk(loanId);
    if (!loan) throw new Error('Loan not found');
    
    const oldData = loan.toJSON();
    const updatedLoan = await loan.update({ 
      status: 'REJECTED',
      approvedBy: adminId,
      remarks: remarks || loan.remarks
    });

    await securityService.logAction(adminId, 'LOAN_REJECTED', 'GOLD_LOAN', loan.id, oldData, updatedLoan.toJSON());

    // Notify Customer
    await notificationService.createNotification({
      customerId: loan.customerId,
      type: 'GOLD_LOAN_REJECTED',
      message: `We regret to inform you that your gold loan application ${loan.loanNumber} has been rejected. Please contact our support for more details.`
    }).catch(err => console.error('[Notification Error] Failed to send rejection alert:', err.message));

    return updatedLoan;
  }

  async updateOverdueLoans() {
    console.log('[GoldLoanService] Scanning for overdue loans...');
    const now = new Date();
    const overdueLoans = await GoldLoan.findAll({
      where: {
        status: 'ACTIVE',
        dueDate: { [Op.lt]: now }
      }
    });

    console.log(`[GoldLoanService] Found ${overdueLoans.length} loans that reached due date.`);

    for (const loan of overdueLoans) {
      const oldStatus = loan.status;
      await loan.update({ status: 'OVERDUE' });
      
      // Notify Customer
      await notificationService.createNotification({
        customerId: loan.customerId,
        type: 'LOAN_OVERDUE',
        message: `Urgent: Your gold loan ${loan.loanNumber} is overdue as of ${loan.dueDate.toLocaleDateString()}. Please make a payment to avoid further penalties.`
      }).catch(err => console.error('[Notification Error] Failed to send overdue alert:', err.message));

      console.log(`[GoldLoanService] Loan ${loan.loanNumber} status changed: ${oldStatus} -> OVERDUE`);
    }

    return overdueLoans.length;
  }
}

module.exports = new GoldLoanService();


