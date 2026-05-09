const NotificationService = require('./notification.service');
const ApiResponse = require('../../shared/utils/apiResponse');

/**
 * Notification Controller
 */
class NotificationController {
  async sendCustom(req, res, next) {
    try {
      const { email, phone, subject, message } = req.body;
      await NotificationService.sendCustom(email, phone, subject, message);
      return ApiResponse.success(res, 'Notification sent successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
