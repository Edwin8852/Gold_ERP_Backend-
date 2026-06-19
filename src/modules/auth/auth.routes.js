const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

const { validateRegister, validateLogin, validateChangePassword, validateUpdateProfile } = require('./auth.validation');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected Routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validateUpdateProfile, authController.updateProfile);
router.post('/change-password', authMiddleware, validateChangePassword, authController.changePassword);

module.exports = router;
