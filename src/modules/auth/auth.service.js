const { User } = require('../../models');
const { hashPassword, comparePassword } = require('../../shared/utils/bcrypt');
const { generateToken } = require('../../shared/utils/jwt');
const { Op } = require('sequelize');

const registerUser = async (userData) => {
  const { firstName, lastName, email, mobile, password } = userData;

  // Check if user exists
  const existingUser = await User.findOne({ 
    where: { 
      [Op.or]: [{ email: email || '' }, { mobile: mobile || '' }] 
    } 
  });
  if (existingUser) {
    throw new Error('User with this email or mobile already exists');
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    mobile,
    password, // Hook will hash it
    role: 'CUSTOMER'
  });

  const userResponse = user.toJSON();
  delete userResponse.password;

  return userResponse;
};

const loginUser = async (identifier, password) => {
  console.log(`[Auth Service] Login attempt for identifier: ${identifier}`);
  
  // Find user by email OR mobile OR customerCode
  const user = await User.findOne({ 
    where: { 
      [Op.or]: [
        { email: identifier },
        { mobile: identifier },
        { customerCode: identifier }
      ]
    },
    include: [{ model: require('../../models').Customer, as: 'customer' }]
  });

  if (!user) {
    console.warn(`[Auth Service] User not found for identifier: ${identifier}`);
    throw new Error('Invalid credentials');
  }


  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Generate token including role
  const token = generateToken({ id: user.id, role: user.role });

  const userResponse = user.toJSON();
  delete userResponse.password;

  return { user: userResponse, token };
};

const changePassword = async (userId, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.password = newPassword;
  user.isFirstLogin = false;
  await user.save();

  return { message: 'Password updated successfully' };
};

const updateProfile = async (userId, updateData) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const allowedUpdates = ['firstName', 'lastName', 'email', 'mobile', 'profileImage'];
  Object.keys(updateData).forEach(key => {
    if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
      // Convert empty strings to null for unique/optional fields
      if (updateData[key] === '') {
        user[key] = null;
      } else {
        user[key] = updateData[key];
      }
    }
  });

  try {
    await user.save();
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('Email or mobile number is already in use by another account.');
    }
    throw new Error(error.errors?.[0]?.message || error.message || 'Validation error');
  }
  const userResponse = user.toJSON();
  delete userResponse.password;
  return userResponse;
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

module.exports = { registerUser, loginUser, getUserById, changePassword, updateProfile };

