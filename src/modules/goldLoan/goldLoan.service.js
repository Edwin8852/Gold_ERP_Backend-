const { GoldLoan, GoldLoanScheme, Customer, User, Invoice, LoanLedger, LoanHistory, LoanLedgerEntry, sequelize } = require('../../models');
const { Op } = require('sequelize');
const valuationService = require('./valuation.service');
const eligibilityService = require('./eligibility.service');
const interestService = require('./interest.service');
const riskService = require('./risk.service');
const securityService = require('../../shared/services/security.service');
const notificationService = require('../notification/notification.service');
const emailService = require('../notification/email/email.service');

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

  async getAllLoans() {
    return await GoldLoan.findAll({
      where: { 
        status: {
          [Op.ne]: 'PENDING_APPROVAL'
        }
      },
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

    // Create Ledger Entry for Loan Creation
    await LoanLedgerEntry.create({
      loanId: loan.id,
      customerId: loan.customerId,
      transactionType: 'LOAN_CREATION',
      amount: approvedAmount,
      balanceAfter: approvedAmount,
      remarks: 'Loan Approved and Disbursed'
    });

    await securityService.logAction(adminId, 'LOAN_APPROVED_AND_ACTIVE', 'GOLD_LOAN', loan.id, oldData, updatedLoan.toJSON());

    // 5. Notify Customer
    try {
      const customerForEmail = await Customer.findByPk(loan.customerId);
      if (customerForEmail && customerForEmail.email) {
        const emailService = require('../notification/email/email.service');
        emailService.sendGoldLoanPreApprovalEmail(customerForEmail, loan.loanNumber, approvedAmount);
      }
    } catch (e) {
      console.warn('Failed to send gold loan approved email', e);
    }

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

  async closeLoan(loanId, adminId, remarks, req) {
    console.log(`[GoldLoanService] Attempting to close loan ${loanId} by admin ${adminId}`);
    const AppError = require('../../shared/utils/AppError');

    const loan = await GoldLoan.findByPk(loanId);
    if (!loan) {
      throw new AppError('Loan Not Found', 404);
    }

    console.log(`[GoldLoanService] Loan found: ${loan.loanNumber}. Current Status: ${loan.status}`);

    const outstandingPrincipal = parseFloat(loan.remainingPrincipal || 0);
    // As per requirement: Outstanding Amount must be zero. (We assume interest/penalty are part of it or handle them similarly).
    if (outstandingPrincipal > 0) {
      throw new AppError(`Cannot close loan. Outstanding Principal: ₹${outstandingPrincipal}`, 400);
    }

    if (loan.status !== 'READY_FOR_CLOSURE') {
      throw new AppError(`Loan is not ready for closure. Current status: ${loan.status}`, 400);
    }

    const t = await sequelize.transaction();
    try {
      await loan.update({
        status: 'CLOSED', // Using standard CLOSED instead of LOAN_CLOSED
        loanClosed: true,
        loanClosedDate: new Date(),
        loanClosedBy: adminId,
        closureRemarks: remarks || 'Loan Closed Successfully'
      }, { transaction: t });

      // Ledger Entry
      try {
        await LoanLedgerEntry.create({
          loanId: loan.id,
          customerId: loan.customerId,
          transactionType: 'CLOSURE',
          amount: 0,
          balanceAfter: 0,
          remarks: remarks || 'Loan Closed Successfully'
        }, { transaction: t });
      } catch (ledgerError) {
        console.error('[GoldLoanService] Ledger Error:', ledgerError.message);
      }

      // Generate Invoice
      const invoiceService = require('../invoice/invoice.service');
      let invoice;
      try {
        invoice = await invoiceService.createInvoice({
          loanId: loan.id,
          invoiceType: 'LOAN_CLOSED',
          oldBalance: outstandingPrincipal,
          paidAmount: 0,
          remainingBalance: 0,
          interestAmount: 0,
          pendingAmount: 0,
          totalPaid: loan.totalPaid || 0,
          createdBy: adminId
        }, t);

        // Generate PDF
        const fs = require('fs');
        const path = require('path');
        const pdfService = require('../../shared/utils/pdf.service');
        const customerData = await Customer.findByPk(loan.customerId, { transaction: t });
        
        const pdfBuffer = await pdfService.generateLoanInvoice(invoice, loan, customerData, null);
        
        const invoicesDir = path.join(__dirname, '../../../../uploads/invoices');
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }
        
        const pdfFilename = `Invoice-${invoice.invoiceNumber}.pdf`;
        const pdfPath = path.join(invoicesDir, pdfFilename);
        
        fs.writeFileSync(pdfPath, pdfBuffer);
        console.log("PDF Generated...");
        console.log("PDF Path:", pdfPath);
        console.log("PDF Exists:", fs.existsSync(pdfPath));
        
        await invoice.update({ pdfPath: pdfPath }, { transaction: t });
      } catch (invoiceError) {
        console.error('[GoldLoanService] Invoice Error:', invoiceError.message);
      }

      await t.commit();
      
      // Notify Customer
      try {
        await notificationService.createNotification({
          customerId: loan.customerId,
          type: 'LOAN_CLOSED',
          message: 'Your loan has been fully settled and closed. Please visit the branch to collect your ornament.'
        });
      } catch (notifError) {
        console.error('[GoldLoanService] Notification Error:', notifError.message);
      }
      
      // Async Email Trigger
      try {
        const customer = await Customer.findByPk(loan.customerId);
        if (customer && customer.email) {
          emailService.sendLoanClosureEmail(customer, loan, invoice); // non-blocking
        }
      } catch (emailError) {
        console.error('[GoldLoanService] Email Error:', emailError.message);
      }

      // Security Audit Log
      try {
        const securityService = require('../../shared/services/security.service');
        await securityService.logAction(adminId, 'LOAN_CLOSED', 'GOLD_LOAN', loan.id, null, null, req);
      } catch (auditErr) {
        console.error('[GoldLoanService] Audit Error:', auditErr.message);
      }

      return loan;
    } catch (error) {
      await t.rollback();
      console.error('[GoldLoanService] Database Error during transaction:', error.message);
      throw error;
    }
  }

  async releaseOrnament(loanId, adminId, releaseNotes, req) {
    const loan = await GoldLoan.findByPk(loanId);
    if (!loan) throw new Error('Loan not found');
    
    if (loan.status !== 'CLOSED') {
      throw new Error('Loan must be closed before releasing ornament');
    }

    const t = await sequelize.transaction();
    try {
      await loan.update({
        status: 'ORNAMENT_RELEASED',
        ornamentReleased: true,
        ornamentReleaseDate: new Date(),
        ornamentReleasedBy: adminId,
        receivedByCustomer: true,
        receivedDate: new Date(),
        releaseNotes: releaseNotes
      }, { transaction: t });

      await LoanHistory.create({
        loanId: loan.id,
        action: 'ORNAMENT_RELEASED',
        remarks: releaseNotes || 'Ornament Released to Customer',
        createdBy: adminId
      }, { transaction: t });

      await LoanLedgerEntry.create({
        loanId: loan.id,
        customerId: loan.customerId,
        transactionType: 'ORNAMENT_RELEASE',
        amount: 0,
        balanceAfter: 0,
        remarks: releaseNotes || 'Ornament Released to Customer'
      }, { transaction: t });

      // Generate Invoice for Ornament Release
      const invoiceService = require('../invoice/invoice.service');
      let invoice;
      try {
        invoice = await invoiceService.createInvoice({
          loanId: loan.id,
          invoiceType: 'LOAN_CLOSED', // Reusing LOAN_CLOSED or could be ORNAMENT_RELEASE
          oldBalance: 0,
          paidAmount: 0,
          remainingBalance: 0,
          interestAmount: 0,
          pendingAmount: 0,
          totalPaid: loan.totalPaid || 0,
          createdBy: adminId
        }, t);

        // Generate PDF
        const fs = require('fs');
        const path = require('path');
        const pdfService = require('../../shared/utils/pdf.service');
        const customerData = await Customer.findByPk(loan.customerId, { transaction: t });
        
        const pdfBuffer = await pdfService.generateLoanInvoice(invoice, loan, customerData, null);
        
        const invoicesDir = path.join(__dirname, '../../../../uploads/invoices');
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }
        
        const pdfFilename = `Release-${invoice.invoiceNumber}.pdf`;
        const pdfPath = path.join(invoicesDir, pdfFilename);
        
        fs.writeFileSync(pdfPath, pdfBuffer);
        console.log("PDF Generated...");
        console.log("PDF Path:", pdfPath);
        console.log("PDF Exists:", fs.existsSync(pdfPath));
        
        await invoice.update({ pdfPath: pdfPath }, { transaction: t });
      } catch (invoiceError) {
        console.error('[GoldLoanService] Release Invoice Error:', invoiceError.message);
      }

      await t.commit();

      // Notify Customer
      await notificationService.createNotification({
        customerId: loan.customerId,
        type: 'ORNAMENT_RELEASED',
        message: 'Your ornament has been successfully released. Thank you for choosing SDRS Gold Finance.'
      }).catch(err => console.error('[Notification Error] Failed to send release alert:', err.message));

      // Async Email Trigger
      try {
        const customer = await Customer.findByPk(loan.customerId);
        if (customer && customer.email) {
          emailService.sendOrnamentReleaseEmail(customer, loan, invoice); // non-blocking
        }
      } catch (e) {
        console.warn('[GoldLoanService] Failed to trigger ornament release email:', e.message);
      }

      // Security Audit Log
      try {
        const securityService = require('../../shared/services/security.service');
        await securityService.logAction(adminId, 'ORNAMENT_RELEASED', 'GOLD_LOAN', loan.id, null, null, req);
      } catch (auditErr) {
        console.error('[GoldLoanService] Audit Error:', auditErr.message);
      }

      return loan;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getLoanLedger(loanId) {
    const loan = await GoldLoan.findByPk(loanId);
    if (!loan) throw new Error('Loan not found');
    
    return await LoanLedgerEntry.findAll({
      where: { loanId },
      order: [['createdAt', 'ASC']]
    });
  }

  async getGlobalLedger(userId, userObj) {
    let whereClause = {};
    if (userObj.role === 'CUSTOMER') {
      const customer = await this._getCustomerByUserId(userObj.id);
      whereClause.customerId = customer.id;
    }
    
    return await LoanLedgerEntry.findAll({
      where: whereClause,
      include: [
        { model: Customer, as: 'customer', attributes: ['firstName', 'lastName', 'customerCode'] },
        { model: GoldLoan, as: 'loan', attributes: ['loanNumber'] }
      ],
      order: [['createdAt', 'DESC']]
    });
  }
  async getLoanDetails(loanId, userObj) {
    try {
      console.log(`[GoldLoanService] Fetching loan details for: ${loanId}`);
      const loan = await GoldLoan.findByPk(loanId, {
        include: [
          { model: Customer, as: 'customer' },
          { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ]
      });

      if (!loan) {
        console.warn(`[GoldLoanService] Loan Not Found: ${loanId}`);
        throw new Error('Loan not found');
      }

    // If customer, ensure it's their loan
    if (userObj && userObj.role === 'CUSTOMER') {
      const customer = await this._getCustomerByUserId(userObj.id);
      if (loan.customerId !== customer.id) {
        throw new Error('Unauthorized access to loan details');
      }
    }

    const [payments, ledgerEntries, histories] = await Promise.all([
      sequelize.models.LoanPayment.findAll({
        where: { loanId },
        include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }],
        order: [['paymentDate', 'DESC']]
      }),
      LoanLedgerEntry.findAll({
        where: { loanId },
        order: [['createdAt', 'DESC']]
      }),
      LoanHistory.findAll({
        where: { loanId },
        order: [['createdAt', 'DESC']]
      })
    ]);

    // Fetch closedBy and releasedBy users if IDs are present
    let closedByUser = null;
    let releasedByUser = null;
    if (loan.loanClosedBy) {
      closedByUser = await User.findByPk(loan.loanClosedBy, { attributes: ['id', 'firstName', 'lastName'] });
    }
    if (loan.ornamentReleasedBy) {
      releasedByUser = await User.findByPk(loan.ornamentReleasedBy, { attributes: ['id', 'firstName', 'lastName'] });
    }

      console.log(`[GoldLoanService] Successfully aggregated details for loan: ${loanId}`);
      return {
        loan,
        payments,
        ledgerEntries,
        histories,
        closedByUser,
        releasedByUser
      };
    } catch (error) {
      console.error(`[GoldLoanService] getLoanDetails Failed for ${loanId}:`, error);
      throw error;
    }
  }
}

module.exports = new GoldLoanService();
