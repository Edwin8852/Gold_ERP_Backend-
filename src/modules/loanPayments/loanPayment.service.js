const { LoanPayment, LoanPaymentHistory, LoanReceipt, GoldLoan, Customer, User, LoanLedgerEntry, sequelize } = require('../../models');
const AppError = require('../../shared/utils/AppError');
const loanLedgerService = require('./loanLedger.service');
const loanHistoryService = require('./loanHistory.service');
const receiptService = require('./receipt.service');

class LoanPaymentService {
  async processPayment(loanId, paymentData, userId) {
    // 1. Duplicate reference ID check (before transaction)
    if (paymentData.referenceNumber) {
      const existingRef = await LoanPayment.findOne({
        where: { transactionId: paymentData.referenceNumber, status: 'SUCCESS' }
      });
      if (existingRef) {
        throw new AppError('A payment with this Transaction/Reference ID has already been processed.', 400);
      }
    }

    // 2. Double-click submit prevention (within 30 seconds for same loan and amount)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const duplicatePayment = await LoanPayment.findOne({
      where: {
        loanId,
        paymentAmount: parseFloat(paymentData.amountPaid),
        status: 'SUCCESS',
        createdAt: {
          [sequelize.Sequelize.Op.gte]: thirtySecondsAgo
        }
      }
    });
    if (duplicatePayment) {
      throw new AppError('Duplicate payment detected. Please wait 30 seconds before submitting the same transaction again.', 400);
    }

    const t = await sequelize.transaction();
    try {
      const loan = await GoldLoan.findByPk(loanId, { transaction: t });
      if (!loan) throw new AppError('Loan not found', 404);

      // 3. Status validation (prevent payments on closed or inactive loans)
      if (loan.status === 'CLOSED' || loan.status === 'REJECTED') {
        throw new AppError(`Cannot process payment. The loan status is currently ${loan.status}.`, 400);
      }
      if (loan.status === 'PENDING_APPROVAL' || loan.status === 'UNDER_VERIFICATION') {
        throw new AppError('Cannot process payment on a loan that has not been approved yet.', 400);
      }

      const outstandingPrincipal = parseFloat(loan.remainingPrincipal || 0);
      const outstandingInterest = parseFloat(loan.interestAmount || 0);
      const outstandingPenalty = parseFloat(loan.penaltyAmount || 0);
      const totalOutstanding = parseFloat((outstandingPrincipal + outstandingInterest + outstandingPenalty).toFixed(2));

      // 4. Validate that there is an outstanding balance to pay
      if (totalOutstanding <= 0) {
        throw new AppError('This loan has no outstanding balance.', 400);
      }

      const amountPaid = parseFloat(paymentData.amountPaid);
      if (isNaN(amountPaid) || amountPaid <= 0) {
        throw new AppError('Invalid payment amount. Amount must be greater than 0.', 400);
      }

      // 5. Overpayment prevention
      if (amountPaid > totalOutstanding) {
        throw new AppError(`Payment amount (₹${amountPaid}) exceeds the total outstanding balance (₹${totalOutstanding.toFixed(2)}).`, 400);
      }

      // 6. Full settlement validation
      if (paymentData.paymentType === 'FULL_SETTLEMENT' && Math.abs(amountPaid - totalOutstanding) > 0.01) {
        throw new AppError(`Full settlement requires the exact outstanding amount of ₹${totalOutstanding.toFixed(2)}.`, 400);
      }

      let remainingPayment = amountPaid;
      let penaltyPaid = 0;
      let interestPaid = 0;
      let principalPaid = 0;

      // 7. Allocation Waterfall logic based on Payment Type
      if (paymentData.paymentType === 'INTEREST_PAYMENT') {
        // Interest Payment: Interest -> Penalty
        interestPaid = Math.min(remainingPayment, outstandingInterest);
        remainingPayment -= interestPaid;

        penaltyPaid = Math.min(remainingPayment, outstandingPenalty);
        remainingPayment -= penaltyPaid;
      } else if (paymentData.paymentType === 'PRINCIPAL_PAYMENT') {
        // Principal Payment: Principal only
        principalPaid = Math.min(remainingPayment, outstandingPrincipal);
        remainingPayment -= principalPaid;
      } else if (paymentData.paymentType === 'PENALTY_PAYMENT') {
        // Penalty Payment: Penalty only
        penaltyPaid = Math.min(remainingPayment, outstandingPenalty);
        remainingPayment -= penaltyPaid;
      } else {
        // PARTIAL_PAYMENT, FULL_SETTLEMENT, or general EMI
        // Standard waterfall allocation: Penalty -> Interest -> Principal
        penaltyPaid = Math.min(remainingPayment, outstandingPenalty);
        remainingPayment -= penaltyPaid;

        interestPaid = Math.min(remainingPayment, outstandingInterest);
        remainingPayment -= interestPaid;

        principalPaid = Math.min(remainingPayment, outstandingPrincipal);
        remainingPayment -= principalPaid;
      }

      // In case of small precision adjustments, if there's any tiny remaining payment, apply it to principal
      if (remainingPayment > 0.01) {
        const extraPrincipal = Math.min(remainingPayment, outstandingPrincipal - principalPaid);
        principalPaid = parseFloat((principalPaid + extraPrincipal).toFixed(2));
        remainingPayment -= extraPrincipal;
      }

      const newRemainingPrincipal = parseFloat(Math.max(0, outstandingPrincipal - principalPaid).toFixed(2));
      const newInterestAmount = parseFloat(Math.max(0, outstandingInterest - interestPaid).toFixed(2));
      const newPenaltyAmount = parseFloat(Math.max(0, outstandingPenalty - penaltyPaid).toFixed(2));

      // 8. Determine loan & payment statuses
      let paymentStatus = 'ACTIVE';
      let loanStatus = 'ACTIVE';

      console.log(`[DEBUG_PAYMENT] AmountPaid: ${amountPaid}, RP: ${outstandingPrincipal}, IA: ${outstandingInterest}, PA: ${outstandingPenalty}`);
      console.log(`[DEBUG_PAYMENT] New RP: ${newRemainingPrincipal}, New IA: ${newInterestAmount}, New PA: ${newPenaltyAmount}`);
      const sumRemaining = newRemainingPrincipal + newInterestAmount + newPenaltyAmount;
      console.log(`[DEBUG_PAYMENT] Sum Remaining: ${sumRemaining}`);

      if (newRemainingPrincipal + newInterestAmount + newPenaltyAmount <= 0) {
        paymentStatus = 'FULLY_PAID';
        loanStatus = 'READY_FOR_CLOSURE';
      } else if (principalPaid === 0 && interestPaid > 0 && penaltyPaid > 0) {
        paymentStatus = 'PENALTY_PAID';
      } else if (principalPaid === 0 && interestPaid > 0) {
        paymentStatus = 'INTEREST_ONLY_PAID';
      } else if (principalPaid > 0) {
        paymentStatus = 'PARTIAL_PAID';
        loanStatus = 'ACTIVE'; // Was PARTIALLY_PAID
      }

      // If there's still a remaining principal and it was overdue or past due, it remains ACTIVE (or OVERDUE if we kept it, but we are standardizing to ACTIVE)
      const isOverdue = loan.dueDate && new Date() > new Date(loan.dueDate);
      if (loanStatus !== 'READY_FOR_CLOSURE' && loanStatus !== 'CLOSED' && loanStatus !== 'ORNAMENT_RELEASED') {
        loanStatus = 'ACTIVE';
      }

      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 9. Create LoanPayment record
      const payment = await LoanPayment.create({
        loanId: loan.id,
        customerId: loan.customerId,
        paymentType: paymentData.paymentType,
        paymentMethod: paymentData.paymentMethod || 'CASH',
        paymentSource: paymentData.paymentSource || 'ADMIN_COLLECTION',
        amountPaid,
        interestCovered: interestPaid,
        principalCovered: principalPaid,
        penaltyCovered: penaltyPaid,
        outstandingBalanceAfter: newRemainingPrincipal,
        referenceNumber: paymentData.referenceNumber,
        remarks: paymentData.remarks,
        createdBy: userId,
        status: 'SUCCESS',

        // Explicit fields
        principalPaid,
        interestPaid,
        penaltyPaid,
        paymentStatus,
        remainingBalance: newRemainingPrincipal,
        invoiceNumber,
        invoiceUrl: `/api/invoices/download-by-number/${invoiceNumber}`
      }, { transaction: t });

      // 10. Log LoanPaymentHistory record
      await LoanPaymentHistory.create({
        loanPaymentId: payment.id,
        action: 'PAYMENT_PROCESSED',
        remarks: `Processed ${paymentData.paymentType} of ₹${amountPaid.toFixed(2)} (Principal: ₹${principalPaid.toFixed(2)}, Interest: ₹${interestPaid.toFixed(2)}, Penalty: ₹${penaltyPaid.toFixed(2)})`,
        oldStatus: loan.status,
        newStatus: loanStatus,
        createdBy: userId
      }, { transaction: t });

      // 11. Log LoanHistory record (general loan activities)
      await loanHistoryService.logHistory(
        loan.id,
        loanStatus === 'READY_FOR_CLOSURE' ? 'READY_FOR_CLOSURE' : loanStatus === 'CLOSED' ? 'CLOSED' : 'PAYMENT_RECEIVED',
        `Received ${paymentData.paymentType} of ₹${amountPaid.toFixed(2)} via ${paymentData.paymentMethod}. Remaining principal: ₹${newRemainingPrincipal.toFixed(2)}`,
        { transaction: t }
      );

      // --- CREATE NEW LEDGER ENTRIES ---
      let runningBalance = parseFloat(loan.remainingPrincipal || 0);

      if (interestPaid > 0) {
        await LoanLedgerEntry.create({
          loanId: loan.id,
          customerId: loan.customerId,
          transactionType: 'INTEREST_PAYMENT',
          amount: interestPaid,
          balanceAfter: runningBalance,
          remarks: `Interest Payment via ${paymentData.paymentMethod}`,
        }, { transaction: t });
      }

      if (penaltyPaid > 0) {
        await LoanLedgerEntry.create({
          loanId: loan.id,
          customerId: loan.customerId,
          transactionType: 'PENALTY',
          amount: penaltyPaid,
          balanceAfter: runningBalance,
          remarks: `Penalty Payment via ${paymentData.paymentMethod}`,
        }, { transaction: t });
      }

      if (principalPaid > 0) {
        runningBalance = parseFloat((runningBalance - principalPaid).toFixed(2));
        await LoanLedgerEntry.create({
          loanId: loan.id,
          customerId: loan.customerId,
          transactionType: 'PRINCIPAL_PAYMENT',
          amount: principalPaid,
          balanceAfter: runningBalance, // Balance drops on principal payment
          remarks: `Principal Payment via ${paymentData.paymentMethod}`,
        }, { transaction: t });
      }
      // ---------------------------------

      const newTotalPaid = parseFloat(((parseFloat(loan.totalPaid) || 0) + amountPaid).toFixed(2));
      const newTotalPrincipalPaid = parseFloat(((parseFloat(loan.totalPrincipalPaid) || 0) + principalPaid).toFixed(2));
      const newTotalInterestPaid = parseFloat(((parseFloat(loan.totalInterestPaid) || 0) + interestPaid).toFixed(2));
      const newTotalPenaltyPaid = parseFloat(((parseFloat(loan.totalPenalty) || 0) + penaltyPaid).toFixed(2));

      // Calculate new monthlyInterest and totalRepayment using goldFinanceService
      const goldFinanceService = require('../goldFinance/goldFinance.service');
      const { monthlyInterest, totalRepayment } = goldFinanceService.calculateFinance(newRemainingPrincipal, loan.interestRate);

      // 12. Update the main GoldLoan record
      await loan.update({
        remainingPrincipal: newRemainingPrincipal,
        status: loanStatus,
        totalPaid: newTotalPaid,
        monthlyInterest,
        totalRepayment,
        interestAmount: newInterestAmount,
        penaltyAmount: newPenaltyAmount,

        // New fields
        currentStatus: loanStatus,
        totalPenalty: newTotalPenaltyPaid,
        totalInterestPaid: newTotalInterestPaid,
        totalPrincipalPaid: newTotalPrincipalPaid,
        lastPaymentDate: new Date()
      }, { transaction: t });

      // 13. Update LoanLedger consolidated metrics
      await loanLedgerService.updateLedger(loan, { transaction: t });

      // 14. Generate standard Invoice inside transaction
      const invoiceService = require('../invoice/invoice.service');
      await invoiceService.createInvoice({
        loanId: loan.id,
        paymentId: payment.id,
        invoiceNumber,
        invoiceType: loanStatus === 'READY_FOR_CLOSURE' || loanStatus === 'CLOSED' ? 'LOAN_CLOSED' : 'PAYMENT_RECEIVED',
        oldBalance: outstandingPrincipal,
        paidAmount: amountPaid,
        remainingBalance: newRemainingPrincipal,
        interestAmount: monthlyInterest,
        pendingAmount: totalRepayment,
        totalPaid: newTotalPaid,
        createdBy: userId
      }, t);

      await t.commit();

      // Trigger Emails & Notifications
      try {
        const customer = await Customer.findByPk(loan.customerId);
        if (customer && customer.email) {
          const emailService = require('../notification/email/email.service');
          // 1. Payment Receipt Email
          emailService.sendPaymentReceiptEmail(customer, amountPaid, invoiceNumber, { pdfPath: null }); // PDF is generated async, maybe won't be attached immediately, but that's fine or we pass invoice if we have it
          
          // 2. Ready For Closure Email
          if (loanStatus === 'READY_FOR_CLOSURE') {
            emailService.sendReadyForClosureEmail(customer, loan.loanNumber);
          }
        }

        // Dashboard Notification is handled by emailService now for these two events, but let's keep the existing logic as well or rely on the email service. 
        // We'll keep existing to avoid breaking anything not covered by email service.
        if (loanStatus === 'READY_FOR_CLOSURE' && loan.status !== 'READY_FOR_CLOSURE') {
          const notificationService = require('../notification/notification.service');
          await notificationService.createNotification({
            customerId: loan.customerId,
            type: 'LOAN_READY_FOR_CLOSURE',
            message: `Your loan ${loan.loanNumber} has been fully repaid and is ready for closure. Please visit the branch to collect your ornament.`
          });
        }
      } catch (err) {
        console.error('[LoanPaymentService] Failed to send email/notification:', err.message);
      }

      // 15. Generate printable PDF receipt and save details post-commit (async)
      try {
        await receiptService.generateReceiptPDF(payment.id, userId);
      } catch (receiptErr) {
        console.error('[LoanPaymentService] PDF Receipt generation failed post-commit:', receiptErr.message);
      }

      return payment;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getLoanPayments(filters) {
    try {
      const { loanId, customerId, status, paymentType, paymentMethod, startDate, endDate } = filters;
      const where = {};

      if (loanId) where.loanId = loanId;
      if (customerId) where.customerId = customerId;
      if (status) where.status = status;
      if (paymentType) where.paymentType = paymentType;
      if (paymentMethod) where.paymentMethod = paymentMethod;

      if (startDate || endDate) {
        where.paymentDate = {};
        if (startDate) where.paymentDate[[sequelize.Sequelize.Op.gte]] = new Date(startDate);
        if (endDate) where.paymentDate[[sequelize.Sequelize.Op.lte]] = new Date(endDate);
      }

      return await LoanPayment.findAll({
        where,
        order: [['paymentDate', 'DESC']],
        include: [
          { model: GoldLoan, as: 'loan' },
          { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'customerCode', 'mobileNumber'] },
          { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
      });
    } catch (error) {
      console.error('[LoanPaymentService] Error in getLoanPayments:', error.message);
      throw error;
    }
  }
}

module.exports = new LoanPaymentService();
