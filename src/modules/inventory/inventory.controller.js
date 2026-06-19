const InventoryService = require('./inventory.service');
const ApiResponse = require('../../shared/utils/apiResponse');

class InventoryController {
  async getDashboard(req, res, next) {
    try {
      const stats = await InventoryService.getDashboardStats();
      return ApiResponse.success(res, 'Dashboard stats retrieved', stats);
    } catch (error) {
      next(error);
    }
  }

  async getItems(req, res, next) {
    try {
      const items = await InventoryService.getAllItems(req.query);
      return ApiResponse.success(res, 'Items retrieved', items);
    } catch (error) {
      next(error);
    }
  }

  async addStock(req, res, next) {
    try {
      // req.user.id exists because of authMiddleware
      const result = await InventoryService.addStock(req.body, req.user.id);
      return ApiResponse.success(res, 'Stock added successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const history = await InventoryService.getHistory(req.query);
      return ApiResponse.success(res, 'History retrieved', history);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
