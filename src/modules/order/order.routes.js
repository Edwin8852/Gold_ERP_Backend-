const express = require('express');
const router = express.Router();
const OrderController = require('./order.controller');
const orderValidation = require('./order.validation');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return next(error);
  next();
};

/**
 * Jewelry Order Routes
 */
router.post('/', validate(orderValidation.create), OrderController.create);
router.get('/', OrderController.getAll);
router.get('/:id', OrderController.getById);
router.patch('/:id', validate(orderValidation.update), OrderController.update);
router.delete('/:id', OrderController.delete);

module.exports = router;
