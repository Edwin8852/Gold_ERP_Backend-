const express = require('express');
const router = express.Router();
const NotificationController = require('./notification.controller');

/**
 * Notification Routes
 */
router.post('/send-custom', NotificationController.sendCustom);

module.exports = router;
