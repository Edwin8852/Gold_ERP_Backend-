const { User } = require('../../models');
const { hashPassword } = require('../../shared/utils/bcrypt');

const getAllUsers = async () => {
  return await User.findAll({
    attributes: { exclude: ['password'] },
    order: [['createdAt', 'DESC']]
  });
};

const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] }
  });
  if (!user) throw new Error('User not found');
  return user;
};

const createUser = async (userData) => {
  const { email, password } = userData;
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new Error('Email already in use');

  const hashedPassword = await hashPassword(password);
  
  const user = await User.create({
    ...userData,
    password: hashedPassword
  });

  const userResponse = user.toJSON();
  delete userResponse.password;
  return userResponse;
};

const updateUser = async (id, updateData) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');

  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  await user.update(updateData);
  
  const userResponse = user.toJSON();
  delete userResponse.password;
  return userResponse;
};

const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');
  await user.destroy();
  return true;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
