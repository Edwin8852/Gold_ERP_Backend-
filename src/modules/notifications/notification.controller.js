const notificationService = require('./notification.service');
const response = require('../../shared/utils/response');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.findAll();
    return response.success(res, 'Notifications retrieved', notifications);
  } catch (error) {
    next(error);
  }
};
