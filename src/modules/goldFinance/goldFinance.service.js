const GoldLoan = require('../../models/goldLoan.model');
const invoiceService = require('../invoice/invoice.service');
const goldRateService = require('../goldRates/goldRate.service');

const calculateFinance = (loanAmount, interestRate) => {
  const monthlyInterest = (loanAmount * interestRate) / (100 * 12);
  const totalRepayment = loanAmount + monthlyInterest;
  return { monthlyInterest, totalRepayment };
};

const createLoan = async (loanData, userId) => {
  const { goldWeight, goldPurity, loanAmount, interestRate = 12 } = loanData;

  // Fetch Current Active Gold Rate for Valuation
  const activeRate = await goldRateService.getCurrentRate();
  const { goldValue, eligibleLoanAmount } = goldRateService.calculateValuation(goldWeight, goldPurity, activeRate);

  if (loanAmount > eligibleLoanAmount) {
    throw new Error(`Requested loan amount exceeds eligible limit. Maximum allowed: ₹${eligibleLoanAmount}`);
  }

  const { monthlyInterest, totalRepayment } = calculateFinance(loanAmount, interestRate);

  const loan = await GoldLoan.create({
    ...loanData,
    principalAmount: loanAmount,
    remainingPrincipal: loanAmount,
    goldValue,
    eligibleLoanAmount,
    loanToValueRatio: 0.75,
    monthlyInterest,
    totalRepayment,
    createdBy: userId,
    loanDate: loanData.loanDate || new Date(),
    dueDate: loanData.dueDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  });

  // Fetch Jewel Inspection details for the invoice report
  const inspections = await require('../jewelInspection/jewelInspection.service').getInspectionsByLoanId(loan.id);
  const conditionReport = inspections.map(i => ({
    jewelType: i.jewelType,
    weight: i.grossWeight,
    purity: i.purity,
    damage: i.damageDescription,
    remarks: i.remarks,
    photoAttached: i.damagePhoto ? 'YES' : 'NO'
  }));

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
    // Note: In a real system, you might store conditionReport in a JSON field in the invoice model
    // For this demonstration, we are ensuring the service can access the data.
  });

  return loan;
};

const getAllLoans = async () => {
  return await GoldLoan.findAll({ order: [['createdAt', 'DESC']] });
};

const getLoanById = async (id) => {
  const loan = await GoldLoan.findByPk(id);
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

module.exports = { createLoan, getAllLoans, getLoanById, updateLoan, closeLoan, deleteLoan, calculateFinance };
