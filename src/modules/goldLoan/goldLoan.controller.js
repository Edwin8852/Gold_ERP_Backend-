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

  async getAll(req, res, next) {
    try {
      const loans = await goldLoanService.getAllLoans();
      ApiResponse.success(res, 'All loans retrieved', loans);
    } catch (error) {
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

  async close(req, res, next) {
    try {
      console.log("[GoldLoanController] Close Loan Route Hit");
      console.log("[GoldLoanController] User:", req.user);
      console.log("[GoldLoanController] Loan ID:", req.params.id);
      
      const loan = await goldLoanService.closeLoan(req.params.id, req.user.id, req.body.remarks, req);
      ApiResponse.success(res, 'Loan Closed Successfully', loan);
    } catch (error) {
      console.error("[GoldLoanController] Error in close:", error);
      next(error);
    }
  }

  async releaseOrnament(req, res, next) {
    try {
      const loan = await goldLoanService.releaseOrnament(req.params.id, req.user.id, req.body.releaseNotes, req);
      ApiResponse.success(res, 'Ornament released successfully', loan);
    } catch (error) {
      next(error);
    }
  }
  async getLedger(req, res, next) {
    try {
      const ledger = await goldLoanService.getLoanLedger(req.params.id);
      ApiResponse.success(res, 'Loan ledger retrieved successfully', ledger);
    } catch (error) {
      next(error);
    }
  }

  async getGlobalLedger(req, res, next) {
    try {
      const isCustomer = req.user.role === 'CUSTOMER';
      const customerId = isCustomer ? req.user.id : null; // Actually need to get customer profile id
      const ledger = await goldLoanService.getGlobalLedger(customerId, req.user);
      ApiResponse.success(res, 'Global ledger retrieved successfully', ledger);
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req, res, next) {
    try {
      console.log(`[GoldLoanController] Fetching details for Loan ID: ${req.params.id}`);
      const details = await goldLoanService.getLoanDetails(req.params.id, req.user);
      ApiResponse.success(res, 'Loan details retrieved successfully', details);
    } catch (error) {
      console.error(`[GoldLoanController] Error fetching details for Loan ID: ${req.params.id} -`, error);
      if (error.message === 'Loan not found') {
        return res.status(404).json({ success: false, message: 'Loan Not Found' });
      }
      return res.status(500).json({ success: false, message: 'Unexpected Server Error', details: error.message });
    }
  }
}

module.exports = new GoldLoanController();
