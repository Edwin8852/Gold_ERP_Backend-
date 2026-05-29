const supportService = require('./support.service');
const ApiResponse = require('../../shared/utils/apiResponse');
const { User, Customer } = require('../../models');
const AppError = require('../../shared/utils/AppError');

class SupportController {
  async createTicket(req, res, next) {
    try {
      let customerId = req.body.customerId;

      if (req.user.role === 'CUSTOMER') {
        const user = await User.findByPk(req.user.id);
        const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
        if (!customer) throw new AppError('Customer profile not found', 404);
        customerId = customer.id;
      }

      if (!customerId) throw new AppError('Customer ID is required', 400);

      const ticket = await supportService.createTicket({
        ...req.body,
        customerId
      });
      return ApiResponse.success(res, 'Support ticket created successfully', ticket, 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyTickets(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user || !user.customerCode) {
        return ApiResponse.success(res, 'No tickets found', []);
      }

      const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
      if (!customer) {
        return ApiResponse.success(res, 'No tickets found', []);
      }

      const tickets = await supportService.getCustomerTickets(customer.id);
      return ApiResponse.success(res, 'Tickets retrieved successfully', tickets);
    } catch (error) {
      next(error);
    }
  }

  async getAllTickets(req, res, next) {
    try {
      const tickets = await supportService.getAllTickets(req.query);
      return ApiResponse.success(res, 'All tickets retrieved successfully', tickets);
    } catch (error) {
      next(error);
    }
  }

  async respondToTicket(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await supportService.respondToTicket(id, req.body, req.user.id);
      return ApiResponse.success(res, 'Response recorded successfully', ticket);
    } catch (error) {
      next(error);
    }
  }

  async getTicketDetails(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await supportService.getTicketDetails(id);
      if (!ticket) throw new AppError('Ticket not found', 404);
      return ApiResponse.success(res, 'Ticket details retrieved successfully', ticket);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SupportController();
