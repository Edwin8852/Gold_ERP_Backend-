const ChitFundService = require('./chitFund.service');
const ApiResponse = require('../../shared/utils/apiResponse');

class ChitFundController {
  async createScheme(req, res, next) {
    try {
      const scheme = await ChitFundService.createScheme(req.body);
      return ApiResponse.success(res, 'Chit Scheme created successfully', scheme, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAllSchemes(req, res, next) {
    try {
      const schemes = await ChitFundService.getAllSchemes(req.query);
      return ApiResponse.success(res, 'Schemes retrieved successfully', schemes);
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSchemes(req, res, next) {
    try {
      const schemes = await ChitFundService.getAvailableSchemes(req.user.id);
      return ApiResponse.success(res, 'Available schemes retrieved successfully', schemes);
    } catch (error) {
      next(error);
    }
  }

  async updateScheme(req, res, next) {
    try {
      const { id } = req.params;
      const scheme = await ChitFundService.updateScheme(id, req.body);
      return ApiResponse.success(res, 'Chit Scheme updated successfully', scheme);
    } catch (error) {
      next(error);
    }
  }

  async deleteScheme(req, res, next) {
    try {
      const { id } = req.params;
      await ChitFundService.deleteScheme(id);
      return ApiResponse.success(res, 'Chit Scheme deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async enrollSubscriber(req, res, next) {
    try {
      const { schemeId, customerId } = req.body;
      const subscriber = await ChitFundService.enrollSubscriber(schemeId, customerId, req.user);
      return ApiResponse.success(res, 'Customer enrolled in scheme successfully', subscriber, 201);
    } catch (error) {
      next(error);
    }
  }

  async collectPayment(req, res, next) {
    try {
      const { installmentId } = req.params;
      const payment = await ChitFundService.collectPayment(installmentId, {
        ...req.body,
        createdBy: req.user?.id
      });
      return ApiResponse.success(res, 'Payment recorded successfully', payment);
    } catch (error) {
      next(error);
    }
  }

  async getSubscriberDetails(req, res, next) {
    try {
      const { subscriberId } = req.params;
      const details = await ChitFundService.getSubscriberDetails(subscriberId);
      return ApiResponse.success(res, 'Subscriber details retrieved successfully', details);
    } catch (error) {
      next(error);
    }
  }

  async getMySubscriptions(req, res, next) {
    try {
      const subscriptions = await ChitFundService.getMySubscriptions(req.user.id);
      return ApiResponse.success(res, 'My subscriptions retrieved successfully', subscriptions);
    } catch (error) {
      next(error);
    }
  }

  async getFullSubscriptionDetails(req, res, next) {
    try {
      const subscriptions = await ChitFundService.getFullSubscriptionDetails(req.user.id);
      return ApiResponse.success(res, 'Full subscription details retrieved successfully', subscriptions);
    } catch (error) {
      next(error);
    }
  }

  async getAllSubscriptions(req, res, next) {
    try {
      const subscriptions = await ChitFundService.getAllSubscriptions();
      return ApiResponse.success(res, 'All subscriptions retrieved successfully', subscriptions);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChitFundController();
