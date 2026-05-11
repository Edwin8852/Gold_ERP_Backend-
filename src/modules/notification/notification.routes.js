const express = require('express');
const router = express.Router();
const NotificationController = require('./notification.controller');

/**
 * Notification Routes
 * SDRS Gold Finance & Jewelry ERP System
 */

// Create manual notification
router.post('/', NotificationController.create);

// Get all notifications (with optional filters)
router.get('/', NotificationController.getAll);

// Get single notification
router.get('/:id', NotificationController.getById);

// Mark as read
router.patch('/:id', NotificationController.markAsRead);

// Trigger automated reminders (Admin/Test)
router.post('/trigger-automated', NotificationController.triggerAutomated);

module.exports = router;
