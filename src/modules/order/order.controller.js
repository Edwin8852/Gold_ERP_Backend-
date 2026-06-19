const OrderService = require('./order.service');
const ApiResponse = require('../../shared/utils/apiResponse');

/**
 * Order Controller
 */
class OrderController {
  async create(req, res, next) {
    try {
      const order = await OrderService.createOrder(req.body, req.user);
      return ApiResponse.success(res, 'Order Created Successfully', order, 201);
    } catch (error) {
      console.error("JEWELLERY ORDER ERROR:", {
        message: error.message,
        stack: error.stack,
        requestBody: req.body,
        params: req.params,
        query: req.query
      });

      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAll(req, res, next) {
    try {
      const orders = await OrderService.getAllOrders(req.query);
      return ApiResponse.success(res, 'Orders retrieved successfully', orders);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      return ApiResponse.success(res, 'Order details retrieved', order);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const order = await OrderService.updateOrder(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Order updated successfully', order);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await OrderService.deleteOrder(req.params.id, req.user);
      return ApiResponse.success(res, 'Order removed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
