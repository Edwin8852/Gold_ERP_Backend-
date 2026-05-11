const NotificationService = require('./notification.service');
const ApiResponse = require('../../shared/utils/apiResponse');

/**
 * Notification Controller
 * SDRS Gold Finance & Jewelry ERP System
 */
class NotificationController {
  /**
   * POST /api/notifications
   * Create a manual notification
   */
  async create(req, res, next) {
    try {
      const notification = await NotificationService.createNotification(req.body);
      return ApiResponse.success(res, 'Notification created successfully', notification, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications
   * Get all notifications
   */
  async getAll(req, res, next) {
    try {
      const { customerId, type } = req.query;
      const filters = {};
      if (customerId) filters.customerId = customerId;
      if (type) filters.type = type;

      const notifications = await NotificationService.getAllNotifications(filters);
      return ApiResponse.success(res, 'Notifications fetched successfully', notifications);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/:id
   * Get single notification
   */
  async getById(req, res, next) {
    try {
      const notification = await NotificationService.getNotificationById(req.params.id);
      if (!notification) {
        return ApiResponse.error(res, 'Notification not found', 404);
      }
      return ApiResponse.success(res, 'Notification fetched successfully', notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id
   * Mark notification as read
   */
  async markAsRead(req, res, next) {
    try {
      const notification = await NotificationService.markAsRead(req.params.id);
      return ApiResponse.success(res, 'Notification marked as read', notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications/trigger-automated
   * Manually trigger automated reminders (for testing/admin)
   */
  async triggerAutomated(req, res, next) {
    try {
      const result = await NotificationService.generateAutomatedReminders();
      return ApiResponse.success(res, 'Automated reminders triggered successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
