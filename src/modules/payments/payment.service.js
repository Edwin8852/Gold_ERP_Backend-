const Payment = require('../../models/payment.model');
const goldFinanceService = require('../goldFinance/goldFinance.service');
const invoiceService = require('../invoice/invoice.service');

const processPayment = async (paymentData, userId) => {
  const { loanId, paymentAmount, paymentMethod = 'CASH' } = paymentData;

  const loan = await goldFinanceService.getLoanById(loanId);
  const oldBalance = loan.remainingPrincipal;
  
  const remainingBalance = oldBalance - paymentAmount;
  const newTotalPaid = loan.totalPaid + paymentAmount;

  // Recalculate interest using reducing balance
  const { monthlyInterest, totalRepayment } = goldFinanceService.calculateFinance(remainingBalance, loan.interestRate);

  // 1. Create Payment Record
  const payment = await Payment.create({
    loanId,
    beforeBalance: oldBalance,
    afterBalance: remainingBalance,
    paymentAmount,
    paymentMethod,
    createdBy: userId
  });

  // 2. Update Loan record
  await loan.update({
    remainingPrincipal: remainingBalance,
    totalPaid: newTotalPaid,
    monthlyInterest,
    totalRepayment,
    status: remainingBalance <= 0 ? 'CLOSED' : loan.status
  });

  // 3. Generate New Payment Invoice
  await invoiceService.createInvoice({
    loanId: loan.id,
    paymentId: payment.id,
    invoiceType: remainingBalance <= 0 ? 'LOAN_CLOSED' : 'PAYMENT_RECEIVED',
    oldBalance: oldBalance,
    paidAmount: paymentAmount,
    remainingBalance: remainingBalance,
    interestAmount: monthlyInterest,
    pendingAmount: totalRepayment,
    totalPaid: newTotalPaid,
    createdBy: userId
  });

  return { payment, loan };
};

module.exports = { processPayment };
