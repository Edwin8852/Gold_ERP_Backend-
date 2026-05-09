const express = require('express');
const router = express.Router();
const customerController = require('./customer.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);

router.get('/search', customerController.searchCustomers);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomer);

router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  customerController.createCustomer
);

router.put(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  customerController.updateCustomer
);

router.delete(
  '/:id',
  authorizeRoles('SUPER_ADMIN'),
  customerController.deleteCustomer
);

module.exports = router;
