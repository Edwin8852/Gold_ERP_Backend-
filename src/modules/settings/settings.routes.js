const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

// Protect all settings routes (admin only)
router.use(authMiddleware);

router.get('/', settingsController.getSettings);
router.put('/:settingKey', settingsController.updateSetting);

module.exports = router;
