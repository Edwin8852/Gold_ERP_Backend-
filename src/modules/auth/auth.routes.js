const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected Routes
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
