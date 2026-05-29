const express = require('express');
const router = express.Router();
const kycController = require('./kyc.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');
const upload = require('../../shared/middleware/upload.middleware');

router.use(authMiddleware);

// Customer Routes
router.post('/submit', upload.fields([
  { name: 'kycAadharFront', maxCount: 1 },
  { name: 'kycAadharBack', maxCount: 1 },
  { name: 'kycPanCard', maxCount: 1 },
  { name: 'kycAddressProof', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]), kycController.submitKyc);

router.get('/status', kycController.getKycStatus);

// Admin Routes
router.put('/:id/approve', authorizeRoles('SUPER_ADMIN', 'ADMIN'), kycController.approveKyc);
router.put('/:id/reject', authorizeRoles('SUPER_ADMIN', 'ADMIN'), kycController.rejectKyc);

module.exports = router;
