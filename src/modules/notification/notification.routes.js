const express = require('express');
const router = express.Router();
const NotificationController = require('./notification.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

// All notification routes are protected
router.use(authMiddleware);

// Create manual notification (Admin only)
router.post('/', authorizeRoles('SUPER_ADMIN', 'ADMIN'), NotificationController.create);

// Get notifications (Filtered by user in controller)
router.get('/', NotificationController.getAll);

// Get single notification
router.get('/:id', NotificationController.getById);

// Mark as read
router.patch('/:id', NotificationController.markAsRead);

// Trigger automated reminders (Super Admin only)
router.post('/trigger-automated', authorizeRoles('SUPER_ADMIN'), NotificationController.triggerAutomated);

module.exports = router;

