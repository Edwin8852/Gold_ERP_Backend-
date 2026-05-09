const express = require('express');
const router = express.Router();
const goldRateController = require('./goldRate.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);

router.get('/current', goldRateController.getCurrentActiveRate);
router.get('/history', goldRateController.getRateHistory);
router.get('/:id', goldRateController.getRate);

router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  goldRateController.createRate
);

router.put(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  goldRateController.updateRate
);

router.delete(
  '/:id',
  authorizeRoles('SUPER_ADMIN'),
  goldRateController.deleteRate
);

module.exports = router;
