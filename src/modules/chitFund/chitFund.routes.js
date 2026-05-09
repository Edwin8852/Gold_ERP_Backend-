const express = require('express');
const router = express.Router();
const chitFundController = require('./chitFund.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);

router.get('/inactive-members', authorizeRoles('SUPER_ADMIN', 'ADMIN'), chitFundController.getInactive);
router.get('/missed-members', authorizeRoles('SUPER_ADMIN', 'ADMIN'), chitFundController.getMissed);

router.patch(
  '/reactivate/:memberId',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  chitFundController.reactivate
);

module.exports = router;
