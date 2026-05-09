const express = require('express');
const router = express.Router();
const CustomerController = require('./customer.controller');
const customerValidation = require('./customer.validation');

/**
 * Validation Middleware Helper
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return next(error);
  next();
};

/**
 * Customer Routes
 */
router.post('/', validate(customerValidation.create), CustomerController.create);
router.get('/', CustomerController.getAll);
router.get('/:id', CustomerController.getById);
router.patch('/:id', validate(customerValidation.update), CustomerController.update);
router.delete('/:id', CustomerController.delete);

module.exports = router;
