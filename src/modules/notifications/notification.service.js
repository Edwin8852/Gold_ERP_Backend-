const { Notification } = require('../../models');

exports.findAll = async () => {
  return await Notification.findAll();
};
