const express = require('express');
const router = express.Router();
const supportController = require('./support.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);

/**
 * Customer Specific Routes
 */
router.post('/tickets', supportController.createTicket);
router.get('/my-tickets', authorizeRoles('CUSTOMER'), supportController.getMyTickets);

/**
 * Admin Routes
 */
router.get('/all-tickets', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), supportController.getAllTickets);
router.get('/tickets/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), supportController.getTicketDetails);
router.patch('/tickets/:id/respond', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), supportController.respondToTicket);

module.exports = router;
