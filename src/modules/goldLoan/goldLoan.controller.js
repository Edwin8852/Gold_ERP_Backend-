const goldLoanService = require('./goldLoan.service');
const repaymentService = require('./repayment.service');
const ApiResponse = require('../../shared/utils/apiResponse');

class GoldLoanController {
  async pay(req, res, next) {
    try {
      const result = await repaymentService.processPayment(req.params.id, req.body, req.user.id);
      ApiResponse.success(res, 'Payment processed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async apply(req, res, next) {
    try {
      console.log('[GoldLoanController] Apply Loan Request Body:', JSON.stringify(req.body, null, 2));
      
      if (!req.body || Object.keys(req.body).length === 0) {
        return ApiResponse.error(res, 'Loan application data is required', 400);
      }

      const loan = await goldLoanService.applyLoan(req.body, req.user.id);
      ApiResponse.success(res, 'Loan application submitted', loan, 201);
    } catch (error) {
      console.error('[GoldLoanController] Error in apply:', error);
      next(error);
    }
  }

  async getMyLoans(req, res, next) {
    try {
      const loans = await goldLoanService.getMyLoans(req.user.id);
      ApiResponse.success(res, 'Loans retrieved', loans);
    } catch (error) {
      next(error);
    }
  }

  async getPending(req, res, next) {
    try {
      console.log('[GoldLoanController] getPending called');
      const loans = await goldLoanService.getPendingLoans();
      console.log(`[GoldLoanController] Sending ${loans.length} loans to client`);
      ApiResponse.success(res, 'Pending applications retrieved', loans);
    } catch (error) {
      console.error('[GoldLoanController] Error in getPending:', error);
      next(error);
    }
  }

  async approve(req, res, next) {
    try {
      const loan = await goldLoanService.approveLoan(req.params.id, req.user.id, req.body);
      ApiResponse.success(res, 'Loan approved', loan);
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const loan = await goldLoanService.rejectLoan(req.params.id, req.user.id, req.body);
      ApiResponse.success(res, 'Loan rejected', loan);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GoldLoanController();
