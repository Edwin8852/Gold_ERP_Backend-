const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');

router.get('/', notificationController.getNotifications);

module.exports = router;
