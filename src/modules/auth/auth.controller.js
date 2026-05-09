const authService = require('./auth.service');

const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
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
  try {
    const { email, password } = req.body;
    const data = await authService.loginUser(email, password);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: data,
    });
  } catch (error) {
    return res.status(401).json({
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

module.exports = { register, login, getProfile };
