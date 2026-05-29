const express = require('express');
const router = express.Router();
const CustomerController = require('./customer.controller');
const customerValidation = require('./customer.validation');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

/**
 * Validation Middleware Helper
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return next(error);
  next();
};

// All routes require authentication
router.use(authMiddleware);

// Customer Facing Routes
router.get('/me/dashboard', authorizeRoles('CUSTOMER'), CustomerController.getMyDashboard);
router.get('/me/profile', authorizeRoles('CUSTOMER'), CustomerController.getMyProfile);
router.get('/me/transactions', authorizeRoles('CUSTOMER'), CustomerController.getMyTransactions);

// Customer Routes - Admin Only
router.get('/search', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), CustomerController.search);
router.get('/', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), CustomerController.getAll);
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'), CustomerController.getById);


router.post(
  '/', 
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'),
  validate(customerValidation.create), 
  CustomerController.create
);

router.patch(
  '/:id', 
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  validate(customerValidation.update), 
  CustomerController.update
);

router.delete(
  '/:id', 
  authorizeRoles('SUPER_ADMIN'),
  CustomerController.delete
);

router.post(
  '/:id/resend-credentials',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  CustomerController.resendCredentials
);


module.exports = router;
