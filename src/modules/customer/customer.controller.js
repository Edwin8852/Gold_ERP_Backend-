const CustomerService = require('./customer.service');
const ApiResponse = require('../../shared/utils/apiResponse');

/**
 * Customer Controller
 * Handles HTTP requests and calls the appropriate service
 */
class CustomerController {
  async create(req, res, next) {
    try {
      const { customer, credentials } = await CustomerService.createCustomer(req.body, req.user?.id);
      return res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer,
        credentials
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      console.log('[CustomerController] Fetching all customers...');
      const customers = await CustomerService.getAllCustomers();
      console.log(`[CustomerController] Successfully retrieved ${customers?.length || 0} customers.`);
      return ApiResponse.success(res, 'Customers retrieved successfully', customers);
    } catch (error) {
      console.error('[CustomerController] Error fetching customers:', error.message);
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

  async search(req, res, next) {
    try {
      const { q } = req.query;
      const customers = await CustomerService.searchCustomers(q);
      return ApiResponse.success(res, 'Search completed', customers);
    } catch (error) {
      next(error);
    }
  }

  async resendCredentials(req, res, next) {
    try {
      const result = await CustomerService.resetCredentials(req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // --- Customer Facing Methods ---

  async getMyDashboard(req, res, next) {
    try {
      const dashboardData = await CustomerService.getMyDashboard(req.user.id);
      return ApiResponse.success(res, 'Dashboard data retrieved successfully', dashboardData);
    } catch (error) {
      next(error);
    }
  }

  async getMyProfile(req, res, next) {
    try {
      const profile = await CustomerService.getMyProfile(req.user.id);
      return ApiResponse.success(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  async getMyTransactions(req, res, next) {
    try {
      const transactions = await CustomerService.getMyTransactions(req.user.id);
      return ApiResponse.success(res, 'Transactions retrieved successfully', transactions);
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new CustomerController();

