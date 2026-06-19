const express = require('express');
const router = express.Router();
const InventoryController = require('./inventory.controller');
const inventoryValidation = require('./inventory.validation');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.query.page ? req.query : req.body, { allowUnknown: true });
  if (error && Object.keys(req.body).length > 0) {
     const bodyErr = schema.validate(req.body);
     if (bodyErr.error) return next(bodyErr.error);
  }
  next();
};

const validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return next(error);
  next();
}

/**
 * Inventory Routes (Protected: Admin, Super Admin)
 */
router.use(authMiddleware);
router.use(authorizeRoles('SUPER_ADMIN', 'ADMIN'));

router.get('/dashboard', InventoryController.getDashboard);
router.get('/items', InventoryController.getItems);
router.post('/items/stock-in', validateBody(inventoryValidation.addStock), InventoryController.addStock);
router.get('/history', InventoryController.getHistory);

module.exports = router;
