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

/**
 * Customer Routes
 */
router.get('/search', CustomerController.search);
router.get('/', CustomerController.getAll);
router.get('/:id', CustomerController.getById);

router.post(
  '/', 
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
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

module.exports = router;
