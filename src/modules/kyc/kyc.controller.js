const kycService = require('./kyc.service');
const ApiResponse = require('../../shared/utils/apiResponse');
const { Customer, User } = require('../../models');
const AppError = require('../../shared/utils/AppError');

class KycController {
  async submitKyc(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id);
      const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
      if (!customer) throw new AppError('Customer profile not found', 404);

      const updatedCustomer = await kycService.submitKyc(customer.id, req.body, req.files);
      return ApiResponse.success(res, 'KYC documents submitted for verification', updatedCustomer);
    } catch (error) {
      next(error);
    }
  }

  async getKycStatus(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id);
      const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
      if (!customer) throw new AppError('Customer profile not found', 404);

      const status = await kycService.getKycStatus(customer.id);
      return ApiResponse.success(res, 'KYC status retrieved', status);
    } catch (error) {
      next(error);
    }
  }

  async approveKyc(req, res, next) {
    try {
      const { id } = req.params;
      const result = await kycService.approveKyc(id, req.user.id);
      return ApiResponse.success(res, 'KYC verified and approved', result);
    } catch (error) {
      next(error);
    }
  }

  async rejectKyc(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await kycService.rejectKyc(id, reason, req.user.id);
      return ApiResponse.success(res, 'KYC rejected', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KycController();
