const express = require('express');
const router = express.Router();
const walkInController = require('./walkIn.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');
const upload = require('../../shared/middleware/upload.middleware');

router.use(authMiddleware);
router.use(authorizeRoles('SUPER_ADMIN', 'ADMIN'));

// 1. Walk-in Customer Registration
router.post('/register', walkInController.registerCustomer);

// 2. KYC Document Upload
router.post('/:id/upload-kyc', upload.fields([
  { name: 'kycAadharFront', maxCount: 1 },
  { name: 'kycAadharBack', maxCount: 1 },
  { name: 'kycPanCard', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'jewelPhotos', maxCount: 10 },
  { name: 'kycSupportingDocs', maxCount: 10 }
]), walkInController.uploadKyc);

// 3. KYC Verification
router.post('/:id/verify-kyc', walkInController.verifyKyc);

// 4. Create and Map Loan
router.post('/create-loan', walkInController.createLoan);

module.exports = router;
