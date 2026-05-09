const express = require('express');
const router = express.Router();
const jewelInspectionController = require('./jewelInspection.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');
const upload = require('../../shared/middleware/upload.middleware');

router.use(authMiddleware);

router.get('/', jewelInspectionController.getInspections);
router.get('/:id', jewelInspectionController.getInspection);

router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  upload.single('damagePhoto'),
  jewelInspectionController.createInspection
);

router.put(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  upload.single('damagePhoto'),
  jewelInspectionController.updateInspection
);

router.delete(
  '/:id',
  authorizeRoles('SUPER_ADMIN'),
  jewelInspectionController.deleteInspection
);

module.exports = router;
