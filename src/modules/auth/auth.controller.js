const authService = require('./auth.service');
const securityService = require('../../shared/services/security.service');

const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    // Log registration as an audit action
    securityService.logAction(user.id, 'REGISTER', 'AUTH', user.id, null, user, req);
    
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  let userId = null;
  try {
    const { email, mobile, customerCode, password } = req.body;
    const identifier = email || mobile || customerCode;
    
    console.log(`[Auth Controller] Login attempt received. Identifier: ${identifier}`);

    if (!identifier) {
      console.warn('[Auth Controller] Login attempt rejected: No identifier provided');
      throw new Error('Email, mobile, or customer code is required');
    }

    const data = await authService.loginUser(identifier, password);
    userId = data.user.id;
    
    // Log Success in security audit
    await securityService.logLogin(userId, 'SUCCESS', req);

    console.log(`[Auth Controller] Login successful for user: ${data.user.email || data.user.mobile || data.user.customerCode} | Role: ${data.user.role}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: data,
    });
  } catch (error) {
    console.error(`[Auth Controller] Login failed: ${error.message}`);
    
    if (userId) await securityService.logLogin(userId, 'FAILED', req);

    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};


const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Optional: if you want to verify current password first, but let's stick to authService implementation
    const result = await authService.changePassword(req.user.id, newPassword);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      user: user,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    console.log(`[Auth Controller] Update profile request for user ID: ${req.user.id}`);
    console.log(`[Auth Controller] Incoming payload:`, req.body);

    const user = await authService.updateProfile(req.user.id, req.body);

    console.log(`[Auth Controller] Profile successfully updated for user ID: ${req.user.id}`);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user,
    });
  } catch (error) {
    console.error('[Update Profile Error]', error.message, error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isValidationError = error.message.includes('already in use') || error.message.includes('Validation') || error.name === 'SequelizeValidationError';
    const statusCode = isValidationError ? 400 : 500;
    const errorMessage = isValidationError ? error.message : 'Internal server error while updating profile.';

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
};

module.exports = { register, login, getProfile, changePassword, updateProfile };

