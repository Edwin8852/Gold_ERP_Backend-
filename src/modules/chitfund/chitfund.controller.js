const ChitfundService = require('./chitfund.service');
const ApiResponse = require('../../shared/utils/apiResponse');

/**
 * Chit Fund Controller
 */
class ChitfundController {
  async create(req, res, next) {
    try {
      const chit = await ChitfundService.createSubscription(req.body);
      return ApiResponse.success(res, 'Chit Fund subscription created', chit, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const chits = await ChitfundService.getAllSubscriptions();
      return ApiResponse.success(res, 'Chit Fund records retrieved', chits);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const chit = await ChitfundService.getSubscriptionById(req.params.id);
      return ApiResponse.success(res, 'Chit Fund details retrieved', chit);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const chit = await ChitfundService.updateSubscription(req.params.id, req.body);
      return ApiResponse.success(res, 'Chit Fund updated successfully', chit);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await ChitfundService.deleteSubscription(req.params.id);
      return ApiResponse.success(res, 'Chit Fund subscription cancelled');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChitfundController();
