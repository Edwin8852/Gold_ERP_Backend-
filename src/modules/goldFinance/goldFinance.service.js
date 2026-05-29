const { GoldLoan, Customer, User, Payment, Invoice, LoanLedger, LoanHistory } = require('../../models');
const invoiceService = require('../invoice/invoice.service');
const goldRateService = require('../goldRates/goldRate.service');
const valuationService = require('./valuation.service');
const riskService = require('./risk.service');

const generateLoanNumber = async () => {
  const lastLoan = await GoldLoan.findOne({ order: [['createdAt', 'DESC']] });
  let nextNumber = 1001;
  if (lastLoan && lastLoan.loanNumber) {
    const lastNum = parseInt(lastLoan.loanNumber.split('-')[1]);
    if (!isNaN(lastNum)) nextNumber = lastNum + 1;
  }
  return `GL-${nextNumber}`;
};

const calculateFinance = (loanAmount, interestRate) => {
  const monthlyInterest = (loanAmount * interestRate) / (100 * 12);
  const totalRepayment = loanAmount + monthlyInterest;
  return { monthlyInterest, totalRepayment };
};

/**
 * Admin: Create a direct active loan
 */
const createLoan = async (loanData, userId) => {
  console.log('[GoldFinanceService] Admin Creating Loan Payload:', loanData);
  const { customerId, goldWeight, goldPurity, loanAmount, interestRate = 12 } = loanData;

  if (!goldWeight || !goldPurity || !loanAmount) {
    throw new AppError('Gold weight, purity, and loan amount are required for disbursement', 400);
  }

  const customer = await Customer.findByPk(customerId);
  if (!customer) throw new AppError('Customer not found', 404);


  const valuation = await valuationService.calculateValuation({
    weight: goldWeight,
    purity: goldPurity,
    requestedAmount: loanAmount
  });

  if (loanAmount > valuation.eligibleLoanAmount) {
    throw new Error(`Requested loan amount exceeds eligible limit. Maximum allowed: ₹${valuation.eligibleLoanAmount}`);
  }

  const { monthlyInterest, totalRepayment } = calculateFinance(loanAmount, interestRate);
  const loanNumber = await generateLoanNumber();

  const loan = await GoldLoan.create({
    ...loanData,
    loanNumber,
    customerName: `${customer.firstName} ${customer.lastName || ''}`,
    mobileNumber: customer.mobileNumber,
    principalAmount: loanAmount,
    remainingPrincipal: loanAmount,
    goldValue: valuation.estimatedGoldValue,
    eligibleLoanAmount: valuation.eligibleLoanAmount,
    loanToValueRatio: 0.75,
    monthlyInterest,
    totalRepayment,
    status: 'ACTIVE',
    createdBy: userId,
    loanDate: loanData.loanDate || new Date(),
    dueDate: loanData.dueDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  });

  // Generate Initial Invoice
  await invoiceService.createInvoice({
    loanId: loan.id,
    invoiceType: 'LOAN_CREATED',
    oldBalance: loanAmount,
    paidAmount: 0,
    remainingBalance: loanAmount,
    interestAmount: monthlyInterest,
    pendingAmount: totalRepayment,
    totalPaid: 0,
    createdBy: userId,
  }).catch(err => console.error('Invoice Generation Failed:', err.message));

  // Log to LoanHistory
  const loanHistoryService = require('./loanHistory.service');
  await loanHistoryService.logHistory(loan.id, 'REQUEST_CREATED', 'Direct shop walk-in gold loan requested');
  await loanHistoryService.logHistory(loan.id, 'LOAN_DISBURSED', `Direct shop loan disbursed immediately. Amount: ₹${loanAmount}`);

  return loan;
};

const AppError = require('../../shared/utils/AppError');

/**
 * Customer: Submit a loan application
 */
const submitLoanRequest = async (data, userId) => {
  const user = await User.findByPk(userId);
  const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
  
  if (!customer) throw new AppError('Customer profile not found', 404);
  if (!customer.isKycVerified || customer.kycStatus !== 'VERIFIED') {
    throw new AppError('KYC verification required before applying for a loan. Please complete your identity verification first.', 403);
  }


  console.log('[GoldFinanceService] Received loan request:', data);

  if (!data.goldWeight || !data.goldPurity || !data.requestedAmount) {
    throw new AppError('Gold weight, purity, and requested amount are required', 400);
  }

  const valuation = await valuationService.calculateValuation({
    weight: data.goldWeight,
    purity: data.goldPurity,
    requestedAmount: data.requestedAmount
  });

  const risk = await riskService.assessCustomerRisk(customer.id);
  const loanNumber = await generateLoanNumber();

  const loanRequest = await GoldLoan.create({
    customerId: customer.id,
    loanNumber,
    customerName: `${customer.firstName} ${customer.lastName || ''}`,
    mobileNumber: customer.mobileNumber,
    goldWeight: data.goldWeight,
    goldPurity: data.goldPurity,
    loanAmount: data.requestedAmount,
    principalAmount: data.requestedAmount,
    remainingPrincipal: data.requestedAmount,
    goldValue: valuation.estimatedGoldValue,
    eligibleLoanAmount: valuation.eligibleLoanAmount,

    riskScore: risk.riskScore,
    riskCategory: risk.category,
    valuationDetails: valuation,
    status: 'PENDING_APPROVAL',
    createdBy: userId,
    loanDate: new Date(),
    dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  });

  // Log to LoanHistory
  const loanHistoryService = require('./loanHistory.service');
  await loanHistoryService.logHistory(loanRequest.id, 'REQUEST_CREATED', `Online gold loan request submitted. Expected weight: ${data.goldWeight}g, Expected loan amount: ₹${data.requestedAmount}`);

  return loanRequest;
};

const getPendingLoans = async () => {
  console.log('[GoldFinanceService] Fetching pending applications...');
  const loans = await GoldLoan.findAll({
    where: { 
      status: ['PENDING_APPROVAL', 'APPROVED'] 
    },
    include: [{ 
      model: Customer, 
      as: 'customer', 
      attributes: ['firstName', 'lastName', 'customerCode', 'mobileNumber'] 
    }],
    order: [['createdAt', 'DESC']]
  });
  console.log(`[GoldFinanceService] Found ${loans.length} pending applications.`);
  return loans;
};

const approveLoan = async (loanId, adminId, valuationData = {}) => {
  console.log(`[GoldFinanceService] Approving Loan ID: ${loanId} with valuation:`, valuationData);
  const transaction = await GoldLoan.sequelize.transaction();
  try {
    const loan = await GoldLoan.findByPk(loanId, { 
      include: [{ model: Customer, as: 'customer' }],
      transaction 
    });
    
    if (!loan) throw new Error('Loan request not found');
    if (loan.status === 'ACTIVE') throw new Error('Loan is already active');

    const finalAmount = Number(valuationData.approvedAmount || loan.loanAmount);
    const finalWeight = Number(valuationData.validatedGoldWeight || loan.goldWeight);
    const goldValue = Number(valuationData.goldValue || (finalWeight * (valuationData.currentGoldRate || 0)));
    const interestRate = Number(valuationData.interestRate || loan.interestRate || 12);
    const loanDuration = Number(valuationData.loanDuration || 12);
    
    const { monthlyInterest, totalRepayment } = calculateFinance(finalAmount, interestRate);
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + loanDuration);

    console.log(`[GoldFinanceService] Calculated → Amount: ₹${finalAmount}, Monthly Interest: ₹${monthlyInterest}, Due: ${dueDate.toLocaleDateString()}`);

    // Step 1: Update Loan Status to ACTIVE
    await loan.update({
      status: 'ACTIVE',
      goldWeight: finalWeight,
      goldValue: goldValue || loan.goldValue,
      approvedAmount: finalAmount,
      principalAmount: finalAmount,
      remainingPrincipal: finalAmount,
      monthlyInterest,
      totalRepayment,
      interestRate,
      loanDuration,
      remarks: valuationData.remarks || loan.remarks,
      currentGoldRate: valuationData.currentGoldRate || loan.currentGoldRate,
      loanDate: new Date(),
      dueDate,
      approvedBy: adminId
    }, { transaction });

    console.log(`[GoldFinanceService] ✅ Loan ${loan.loanNumber} status updated to ACTIVE`);

    // Step 2: Create LoanLedger Entry (tracks balance sheet for customer)
    const existingLedger = await LoanLedger.findOne({ where: { loanId: loan.id }, transaction });
    if (!existingLedger) {
      await LoanLedger.create({
        loanId: loan.id,
        customerId: loan.customerId,
        totalLoanAmount: finalAmount,
        totalPaidAmount: 0,
        remainingBalance: finalAmount,
        totalInterestPaid: 0,
        totalPenaltyPaid: 0,
        nextDueDate: dueDate,
        lastPaymentDate: null
      }, { transaction });
      console.log(`[GoldFinanceService] ✅ LoanLedger created for loan ${loan.loanNumber}`);
    } else {
      await existingLedger.update({ remainingBalance: finalAmount, totalLoanAmount: finalAmount, nextDueDate: dueDate }, { transaction });
      console.log(`[GoldFinanceService] ✅ LoanLedger updated for loan ${loan.loanNumber}`);
    }

    // Step 3: Create LoanHistory Entries
    await LoanHistory.create({ loanId: loan.id, action: 'LOAN_APPROVED', remarks: `Loan approved by admin. Amount: ₹${finalAmount}, Interest: ${interestRate}% p.a.` }, { transaction });
    console.log(`[GoldFinanceService] ✅ LoanHistory LOAN_APPROVED logged`);

    // Step 4: Generate Initial Invoice
    await invoiceService.createInvoice({
      loanId: loan.id,
      invoiceType: 'LOAN_CREATED',
      oldBalance: 0,
      paidAmount: 0,
      remainingBalance: finalAmount,
      interestAmount: monthlyInterest,
      pendingAmount: totalRepayment,
      totalPaid: 0,
      createdBy: adminId,
    }, transaction);
    console.log(`[GoldFinanceService] ✅ Invoice generated for loan ${loan.loanNumber}`);

    await transaction.commit();
    console.log(`[GoldFinanceService] ✅ Transaction committed for loan ${loan.loanNumber}`);
    
    // Step 5: Log additional history actions after commit
    const loanHistoryService = require('./loanHistory.service');
    await loanHistoryService.logHistory(loanId, 'CUSTOMER_VISITED_SHOP', 'Customer visited branch with physical ornaments/jewelry for inspection.');
    await loanHistoryService.logHistory(loanId, 'LOAN_DISBURSED', `Physical gold verification completed. Loan disbursed successfully. Disbursed Amount: ₹${finalAmount}`);

    // Step 6: Send Customer Notification
    const notificationService = require('../notification/notification.service');
    await notificationService.createNotification({
      customerId: loan.customerId,
      type: 'GOLD_LOAN_APPROVED',
      message: `Your gold loan ${loan.loanNumber} has been approved and ₹${finalAmount} disbursed. Monthly interest: ₹${monthlyInterest.toFixed(2)}. Due date: ${dueDate.toLocaleDateString()}.`
    }).catch(err => console.error('[Notification Error]', err.message));

    // Step 7: Return fully populated loan object
    return await GoldLoan.findByPk(loanId, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'customerCode', 'mobileNumber'] },
        { model: Payment, as: 'payments' },
        { model: LoanLedger, as: 'ledger' }
      ]
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`[GoldFinanceService] ❌ Approval transaction rolled back for loan ${loanId}:`, error.message);
    throw error;
  }
};

const preApproveLoan = async (loanId, adminId) => {
  console.log(`[GoldFinanceService] Pre-approving Loan ID: ${loanId} by admin: ${adminId}`);
  const loan = await GoldLoan.findByPk(loanId, {
    include: [{ model: Customer, as: 'customer' }]
  });

  if (!loan) throw new Error('Loan request not found');
  if (loan.status !== 'PENDING_APPROVAL') {
    throw new Error(`Loan request cannot be pre-approved. Current status is ${loan.status}`);
  }

  await loan.update({
    status: 'APPROVED',
    approvedBy: adminId
  });

  // Log to LoanHistory
  const loanHistoryService = require('./loanHistory.service');
  await loanHistoryService.logHistory(loan.id, 'ADMIN_APPROVED', 'Gold loan pre-approved online by Administrator. Notification sent to customer to visit shop.');

  const notificationService = require('../notification/notification.service');
  await notificationService.createNotification({
    customerId: loan.customerId,
    type: 'GOLD_LOAN_PRE_APPROVED',
    message: `your loan process was success please come with your ornament or jewellery collect your cash in our shop`
  }).catch(err => console.error('[Notification Error] Failed to send pre-approval alert:', err.message));

  return loan;
};

const rejectLoan = async (loanId, adminId, valuationData = {}) => {
  console.log(`[GoldFinanceService] Rejecting Loan ID: ${loanId} by admin: ${adminId}`);
  const loan = await GoldLoan.findByPk(loanId);
  if (!loan) throw new Error('Loan request not found');

  await loan.update({
    status: 'REJECTED',
    approvedBy: adminId,
    remarks: valuationData.remarks || loan.remarks
  });

  const notificationService = require('../notification/notification.service');
  await notificationService.createNotification({
    customerId: loan.customerId,
    type: 'GOLD_LOAN_REJECTED',
    message: `We regret to inform you that your gold loan application ${loan.loanNumber} has been rejected. Remarks: ${valuationData.remarks || 'None'}`
  }).catch(err => console.error('[Notification Error] Failed to send rejection alert:', err.message));

  return loan;
};


const getMyLoans = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user || !user.customerCode) return [];
  
  const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
  if (!customer) return [];

  console.log(`[GoldFinanceService] Fetching loans for customer: ${customer.id} (${customer.firstName})`);
  const loans = await GoldLoan.findAll({
    where: { customerId: customer.id },
    include: [
      { model: Payment, as: 'payments' },
      { model: LoanLedger, as: 'ledger' }
    ],
    order: [['createdAt', 'DESC']]
  });
  console.log(`[GoldFinanceService] Found ${loans.length} loans for customer ${customer.id}`);
  return loans;
};

const getAllLoans = async () => {
  return await GoldLoan.findAll({ 
    include: [
      { 
        model: Customer, 
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'customerCode', 'mobileNumber']
      },
      { 
        model: Payment, 
        as: 'payments' 
      },
      { 
        model: Invoice, 
        as: 'invoices' 
      },
      {
        model: LoanLedger,
        as: 'ledger'
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ],
    order: [['createdAt', 'DESC']] 
  });
};




const getLoanById = async (id) => {
  const loan = await GoldLoan.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: Payment, as: 'payments' }
    ]
  });
  if (!loan) throw new Error('Gold loan not found');
  return loan;
};

const updateLoan = async (id, updateData) => {
  const loan = await getLoanById(id);
  if (updateData.loanAmount || updateData.interestRate) {
    const amount = updateData.loanAmount || loan.remainingPrincipal;
    const rate = updateData.interestRate || loan.interestRate;
    const { monthlyInterest, totalRepayment } = calculateFinance(amount, rate);
    updateData.monthlyInterest = monthlyInterest;
    updateData.totalRepayment = totalRepayment;
  }
  await loan.update(updateData);
  return loan;
};

const closeLoan = async (id) => {
  const loan = await getLoanById(id);
  await loan.update({ status: 'CLOSED' });
  return loan;
};

const deleteLoan = async (id) => {
  const loan = await getLoanById(id);
  await loan.destroy();
  return true;
};


module.exports = { 
  createLoan, 
  submitLoanRequest,
  getPendingLoans,
  approveLoan,
  preApproveLoan,
  rejectLoan,
  getMyLoans,
  getAllLoans, 
  getLoanById, 
  updateLoan, 
  closeLoan, 
  deleteLoan, 
  calculateFinance 
};


