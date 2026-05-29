const express = require('express');
const router = express.Router();
const schemeController = require('./scheme.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');

router.use(authMiddleware);

// Admin Routes
router.post('/', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER'), schemeController.create);
router.patch('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER'), schemeController.update);
router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'MANAGER'), schemeController.delete);

// Common Routes
router.get('/', schemeController.getAll);
router.get('/:id', schemeController.getById);

module.exports = router;
