const CustomerService = require('./customer.service');
const ApiResponse = require('../../shared/utils/apiResponse');

/**
 * Customer Controller
 * Handles HTTP requests and calls the appropriate service
 */
class CustomerController {
  async create(req, res, next) {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      return ApiResponse.success(res, 'Customer created successfully', customer, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const customers = await CustomerService.getAllCustomers();
      return ApiResponse.success(res, 'Customers retrieved successfully', customers);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      return ApiResponse.success(res, 'Customer retrieved successfully', customer);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const customer = await CustomerService.updateCustomer(req.params.id, req.body);
      return ApiResponse.success(res, 'Customer updated successfully', customer);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await CustomerService.deleteCustomer(req.params.id);
      return ApiResponse.success(res, 'Customer deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
