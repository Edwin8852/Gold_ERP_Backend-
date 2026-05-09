const User = require('../../models/user.model');
const { hashPassword, comparePassword } = require('../../shared/utils/bcrypt');
const { generateToken } = require('../../shared/utils/jwt');

const registerUser = async (userData) => {
  const { email, password } = userData;

  // Check if user exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await User.create({
    ...userData,
    password: hashedPassword,
  });

  // Return user without password
  const userResponse = user.toJSON();
  delete userResponse.password;

  return userResponse;
};

const loginUser = async (email, password) => {
  // Find user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Compare password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Generate token including role
  const token = generateToken({ id: user.id, role: user.role });

  const userResponse = user.toJSON();
  delete userResponse.password;

  return { user: userResponse, token };
};

const getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }
  const userResponse = user.toJSON();
  delete userResponse.password;
  return userResponse;
};

module.exports = { registerUser, loginUser, getUserById };
