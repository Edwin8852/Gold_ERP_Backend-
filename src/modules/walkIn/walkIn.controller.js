const walkInService = require('./walkIn.service');
const ApiResponse = require('../../shared/utils/apiResponse');
const AppError = require('../../shared/utils/AppError');

class WalkInController {
  /**
   * Register a Walk-in Customer
   */
  async registerCustomer(req, res, next) {
    try {
      const { name, mobileNumber, alternativeNumber, aadharNumber, panNumber, address, gender, occupation, remarks } = req.body;

      if (!name || !mobileNumber || !aadharNumber) {
        throw new AppError('Customer Name, Mobile Number, and Aadhaar Number are required fields.', 400);
      }

      // Validations
      if (!/^\d{10}$/.test(mobileNumber)) {
        throw new AppError('Mobile Number must be exactly 10 digits.', 400);
      }

      if (!/^\d{12}$/.test(aadharNumber)) {
        throw new AppError('Aadhaar Number must be exactly 12 digits.', 400);
      }

      const customer = await walkInService.registerCustomer(req.body, req.user.id);
      return ApiResponse.success(res, 'Walk-in customer registered successfully', customer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload KYC Documents for a Customer
   */
  async uploadKyc(req, res, next) {
    try {
      const { id } = req.params;
      const updatedCustomer = await walkInService.uploadKyc(id, req.files);
      return ApiResponse.success(res, 'KYC documents uploaded successfully', updatedCustomer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify KYC status for a customer
   */
  async verifyKyc(req, res, next) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      if (!status) {
        throw new AppError('Verification status is required', 400);
      }

      const customer = await walkInService.verifyKyc(id, status, remarks);
      return ApiResponse.success(res, `KYC status updated to ${status}`, customer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create and disburse loan for walk-in customer
   */
  async createLoan(req, res, next) {
    try {
      const { customerId, goldType, ornamentType, goldWeight, goldPurity, loanAmount, interestRate, duration, marketRate } = req.body;

      if (!customerId || !goldWeight || !goldPurity || !loanAmount) {
        throw new AppError('Customer ID, Gold Weight, Gold Purity, and Loan Amount are required to disburse the loan.', 400);
      }

      const loan = await walkInService.createLoan(req.body, req.user.id);
      return ApiResponse.success(res, 'Walk-in Loan disbursed and activated successfully', loan);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WalkInController();
