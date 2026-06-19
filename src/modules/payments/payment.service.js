const { Payment, GoldLoan, Customer, sequelize } = require('../../models');
const goldFinanceService = require('../goldFinance/goldFinance.service');
const invoiceService = require('../invoice/invoice.service');
const ledgerService = require('../ledger/ledger.service');

const processPaymentBreakdown = (loan, paymentAmount, paymentType) => {
  const outstandingPrincipal = parseFloat(loan.remainingPrincipal || 0);
  const outstandingInterest = parseFloat(loan.interestAmount || loan.monthlyInterest || 0);
  const outstandingPenalty = parseFloat(loan.penaltyAmount || 0);

  let remainingPayment = paymentAmount;
  let penaltyPaid = 0;
  let interestPaid = 0;
  let principalPaid = 0;

  if (paymentType === 'INTEREST_ONLY') {
    interestPaid = Math.min(remainingPayment, outstandingInterest);
    remainingPayment -= interestPaid;
    
    penaltyPaid = Math.min(remainingPayment, outstandingPenalty);
    remainingPayment -= penaltyPaid;
  } else if (paymentType === 'PRINCIPAL_ONLY') {
    principalPaid = Math.min(remainingPayment, outstandingPrincipal);
    remainingPayment -= principalPaid;
  } else {
    // Default EMI waterfall: penalty -> interest -> principal
    penaltyPaid = Math.min(remainingPayment, outstandingPenalty);
    remainingPayment -= penaltyPaid;

    interestPaid = Math.min(remainingPayment, outstandingInterest);
    remainingPayment -= interestPaid;

    principalPaid = Math.min(remainingPayment, outstandingPrincipal);
    remainingPayment -= principalPaid;

    if (remainingPayment > 0) {
      principalPaid += remainingPayment;
      remainingPayment = 0;
    }
  }

  const newRemainingPrincipal = Math.max(0, outstandingPrincipal - principalPaid);
  const newInterestAmount = Math.max(0, outstandingInterest - interestPaid);
  const newPenaltyAmount = Math.max(0, outstandingPenalty - penaltyPaid);

  let paymentStatus = 'ACTIVE';
  let loanStatus = 'ACTIVE';

  if (newRemainingPrincipal + newInterestAmount + newPenaltyAmount <= 0) {
    paymentStatus = 'FULLY_PAID';
    loanStatus = 'READY_FOR_CLOSURE';
  } else if (principalPaid === 0 && interestPaid > 0 && penaltyPaid > 0) {
    paymentStatus = 'PENALTY_PAID';
    loanStatus = 'ACTIVE';
  } else if (principalPaid === 0 && interestPaid > 0) {
    paymentStatus = 'INTEREST_ONLY_PAID';
    loanStatus = 'ACTIVE';
  } else if (principalPaid > 0) {
    paymentStatus = 'PARTIAL_PAID';
    loanStatus = 'ACTIVE';
  }

  const isOverdue = new Date() > new Date(loan.dueDate);
  if (isOverdue && newRemainingPrincipal > 0) {
    loanStatus = 'OVERDUE';
  }

  return {
    penaltyPaid,
    interestPaid,
    principalPaid,
    newRemainingPrincipal,
    newInterestAmount,
    newPenaltyAmount,
    paymentStatus,
    loanStatus,
    outstandingPenalty,
    outstandingInterest,
    outstandingPrincipal
  };
};

const processPayment = async (paymentData, userId) => {
  const { loanId, paymentAmount, paymentMethod = 'CASH' } = paymentData;
  const paymentType = paymentData.paymentType || 'EMI';

  const t = await sequelize.transaction();

  try {
    const loan = await goldFinanceService.getLoanById(loanId);
    const oldBalance = loan.remainingPrincipal;

    const breakdown = processPaymentBreakdown(loan, paymentAmount, paymentType);
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newTotalPaid = (parseFloat(loan.totalPaid) || 0) + paymentAmount;
    const newTotalPrincipalPaid = (parseFloat(loan.totalPrincipalPaid) || 0) + breakdown.principalPaid;
    const newTotalInterestPaid = (parseFloat(loan.totalInterestPaid) || 0) + breakdown.interestPaid;
    const newTotalPenaltyPaid = (parseFloat(loan.totalPenalty) || 0) + breakdown.penaltyPaid;

    // 1. Create Payment Record
    const payment = await Payment.create({
      loanId,
      customerId: loan.customerId,
      beforeBalance: oldBalance,
      afterBalance: breakdown.newRemainingPrincipal,
      paymentAmount,
      penaltyAmount: breakdown.penaltyPaid,
      paymentType,
      paymentMethod,
      createdBy: userId,
      status: 'SUCCESS',
      
      // New fields
      principalPaid: breakdown.principalPaid,
      interestPaid: breakdown.interestPaid,
      penaltyPaid: breakdown.penaltyPaid,
      paymentStatus: breakdown.paymentStatus,
      remainingBalance: breakdown.newRemainingPrincipal,
      invoiceNumber: invoiceNumber,
      invoiceUrl: `/api/invoices/download-by-number/${invoiceNumber}` // Friendly URL
    }, { transaction: t });

    // 2. Update Loan record
    const { monthlyInterest, totalRepayment } = goldFinanceService.calculateFinance(Math.max(0, breakdown.newRemainingPrincipal), loan.interestRate);
    
    await loan.update({
      remainingPrincipal: Math.max(0, breakdown.newRemainingPrincipal),
      totalPaid: newTotalPaid,
      monthlyInterest,
      totalRepayment,
      interestAmount: breakdown.newInterestAmount,
      penaltyAmount: breakdown.newPenaltyAmount,
      status: breakdown.loanStatus,

      // New fields
      currentStatus: breakdown.loanStatus,
      totalPenalty: newTotalPenaltyPaid,
      totalInterestPaid: newTotalInterestPaid,
      totalPrincipalPaid: newTotalPrincipalPaid,
      lastPaymentDate: new Date()
    }, { transaction: t });

    // Log to LoanHistory
    const loanHistoryService = require('../goldFinance/loanHistory.service');
    if (breakdown.loanStatus === 'READY_FOR_CLOSURE') {
      await loanHistoryService.logHistory(loan.id, 'READY_FOR_CLOSURE', `Loan fully repaid and ready for closure. Full repayment of remaining balance received. Paid Amount: ₹${paymentAmount}`, { transaction: t });
    } else {
      await loanHistoryService.logHistory(loan.id, 'INTEREST_PAID', `Repayment of ₹${paymentAmount} received. Remaining principal: ₹${breakdown.newRemainingPrincipal}`, { transaction: t });
    }

    // 3. Create Ledger Entry for the Payment (CREDIT to the system)
    await ledgerService.createEntry({
      transactionType: 'CREDIT',
      category: 'LOAN_REPAYMENT',
      amount: paymentAmount,
      customerId: loan.customerId,
      loanId: loan.id,
      paymentId: payment.id,
      description: `Loan Repayment received for loan ${loanId}`
    }, userId, t);

    // 4. Generate New Payment Invoice
    await invoiceService.createInvoice({
      loanId: loan.id,
      paymentId: payment.id,
      invoiceNumber: invoiceNumber,
      invoiceType: breakdown.loanStatus === 'READY_FOR_CLOSURE' ? 'LOAN_CLOSED' : 'PAYMENT_RECEIVED',
      oldBalance: oldBalance,
      paidAmount: paymentAmount,
      remainingBalance: breakdown.newRemainingPrincipal,
      interestAmount: monthlyInterest,
      pendingAmount: totalRepayment,
      totalPaid: newTotalPaid,
      createdBy: userId
    }, t);

    // 5. Risk Engine Hook: Improve risk score on successful payment
    const customer = await Customer.findByPk(loan.customerId, { transaction: t });
    if (customer) {
      let newRiskScore = customer.riskScore - 2; // Improve by 2 points
      if (newRiskScore < 0) newRiskScore = 0;
      await customer.update({ riskScore: newRiskScore, lastRiskUpdate: new Date() }, { transaction: t });
    }

    await t.commit();

    // 6. Asynchronous Notification
    const NotificationService = require('../notification/notification.service');
    NotificationService.createNotification({
      customerId: loan.customerId,
      type: 'PAYMENT_RECEIVED',
      message: `Payment of ₹${paymentAmount.toLocaleString()} received successfully for loan ${loan.loanCode || loan.id}.`
    }).catch(err => console.error('Notification Error:', err.message));

    return { payment, loan };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const getAllPayments = async (filters = {}) => {
  const { User } = require('../../models');
  const { loanId } = filters;
  const where = {};
  if (loanId) where.loanId = loanId;
  
  return await Payment.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: GoldLoan,
        as: 'loan',
        include: [{ model: Customer, as: 'customer' }]
      },
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName']
      }
    ]
  });
};

const getLoanPayments = async (loanId) => {
  return await getAllPayments({ loanId });
};

module.exports = { processPayment, getAllPayments, getLoanPayments };

