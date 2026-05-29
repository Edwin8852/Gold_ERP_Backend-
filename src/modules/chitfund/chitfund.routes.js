const express = require('express');
const router = express.Router();
const ChitFundController = require('./chitfund.controller');
const auctionController = require('./auction.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * Scheme Management
 */
router.get('/schemes', ChitFundController.getAllSchemes);
router.get('/schemes/available', authorizeRoles('CUSTOMER'), ChitFundController.getAvailableSchemes);
router.post('/schemes', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ChitFundController.createScheme);
router.put('/schemes/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ChitFundController.updateScheme);
router.delete('/schemes/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN'), ChitFundController.deleteScheme);

/**
 * Subscriber Management
 */
router.post('/enroll', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CUSTOMER'), ChitFundController.enrollSubscriber);
router.get('/my-subscriptions', authorizeRoles('CUSTOMER'), ChitFundController.getMySubscriptions);
router.get('/my-subscriptions/full', authorizeRoles('CUSTOMER'), ChitFundController.getFullSubscriptionDetails);
router.get('/all-subscriptions', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ChitFundController.getAllSubscriptions);
router.get('/subscriber/:subscriberId', ChitFundController.getSubscriberDetails);

/**
 * Auction Management
 */
router.post('/auctions/conduct', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER'), auctionController.conduct);
router.get('/schemes/:schemeId/auctions', auctionController.getHistory);
router.get('/auctions/:schemeId', auctionController.getHistory);

/**
 * Payment Management
 */
router.post('/payment/:installmentId', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'), ChitFundController.collectPayment);

module.exports = router;
