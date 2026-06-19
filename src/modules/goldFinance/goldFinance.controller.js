const GoldFinanceService = require('./goldFinance.service');
const ApiResponse = require('../../shared/utils/apiResponse');

class GoldFinanceController {
    async create(req, res, next) {
        try {
            const result = await GoldFinanceService.createLoan(req.body, req.user.id);
            return ApiResponse.success(res, 'Loan created successfully', result, 201);
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
    try {
      console.log(`[GoldFinanceController] getAllLoans triggered by user: ${req.user.id} (${req.user.role})`);
      
      const loans = await GoldFinanceService.getAllLoans();
      
      console.log(`[GoldFinanceController] Successfully fetched ${loans.length} loans`);
      return ApiResponse.success(res, 'Loans retrieved successfully', loans);
    } catch (error) {
      console.error('[GoldFinanceController] GET ALL LOANS ERROR:', error);
      next(error);
    }
  }

    async getById(req, res, next) {
        try {
            const result = await GoldFinanceService.getLoanById(req.params.id);
            return ApiResponse.success(res, 'Loan details retrieved', result);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const result = await GoldFinanceService.updateLoan(req.params.id, req.body);
            return ApiResponse.success(res, 'Loan updated successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async close(req, res, next) {
        try {
            console.log("[GoldFinanceController] Redirecting legacy close to GoldLoanService");
            const goldLoanService = require('../goldLoan/goldLoan.service');
            const result = await goldLoanService.closeLoan(req.params.id, req.user.id, req.body.remarks);
            return ApiResponse.success(res, 'Loan closed successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await GoldFinanceService.deleteLoan(req.params.id);
            return ApiResponse.success(res, 'Loan deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Handle customer initiated loan request
     */
    async requestLoan(req, res, next) {
        try {
            const result = await GoldFinanceService.submitLoanRequest(req.body, req.user.id);
            return ApiResponse.success(res, 'Loan application submitted successfully', result, 201);
        } catch (error) {
            next(error);
        }
    }

    async getPendingLoans(req, res, next) {
        try {
            const result = await GoldFinanceService.getPendingLoans();
            return ApiResponse.success(res, 'Pending loan applications retrieved', result);
        } catch (error) {
            next(error);
        }
    }

    async approveLoan(req, res, next) {
        try {
            const result = await GoldFinanceService.approveLoan(req.params.id, req.user.id, req.body);
            return ApiResponse.success(res, 'Loan approved and invoice generated successfully', result);
        } catch (error) {
            console.error('[GoldFinanceController] Approval Error:', error);
            next(error);
        }
    }

    async preApproveLoan(req, res, next) {
        try {
            const result = await GoldFinanceService.preApproveLoan(req.params.id, req.user.id);
            return ApiResponse.success(res, 'Loan pre-approved successfully. Notification sent to customer.', result);
        } catch (error) {
            console.error('[GoldFinanceController] Pre-Approval Error:', error);
            next(error);
        }
    }

    async rejectLoan(req, res, next) {
        try {
            const result = await GoldFinanceService.rejectLoan(req.params.id, req.user.id, req.body);
            return ApiResponse.success(res, 'Loan request rejected successfully', result);
        } catch (error) {
            console.error('[GoldFinanceController] Reject Error:', error);
            next(error);
        }
    }


    async getMyLoans(req, res, next) {
        try {
            const result = await GoldFinanceService.getMyLoans(req.user.id);
            return ApiResponse.success(res, 'My loans retrieved successfully', result);
        } catch (error) {
            next(error);
        }
    }

    async getLoanHistory(req, res, next) {
        try {
            const loanHistoryService = require('./loanHistory.service');
            const result = await loanHistoryService.getLoanHistory(req.params.id);
            return ApiResponse.success(res, 'Loan history retrieved successfully', result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new GoldFinanceController();
