const { Op } = require('sequelize');
const Customer = require('../../models/customer.model');

const generateCustomerCode = async () => {
  const lastCustomer = await Customer.findOne({
    order: [['createdAt', 'DESC']],
  });

  let nextNumber = 1001;
  if (lastCustomer && lastCustomer.customerCode) {
    const lastCode = lastCustomer.customerCode;
    const lastNumber = parseInt(lastCode.split('-')[1]);
    nextNumber = lastNumber + 1;
  }

  return `CUST-${nextNumber}`;
};

const createCustomer = async (customerData, userId) => {
  const customerCode = await generateCustomerCode();
  
  const customer = await Customer.create({
    ...customerData,
    customerCode,
    createdBy: userId
  });

  return customer;
};

const getAllCustomers = async () => {
  return await Customer.findAll({ order: [['createdAt', 'DESC']] });
};

const getCustomerById = async (id) => {
  const customer = await Customer.findByPk(id, {
    include: ['loans']
  });
  if (!customer) throw new Error('Customer not found');
  return customer;
};

const updateCustomer = async (id, updateData) => {
  const customer = await getCustomerById(id);
  await customer.update(updateData);
  return customer;
};

const deleteCustomer = async (id) => {
  const customer = await getCustomerById(id);
  await customer.destroy();
  return true;
};

const searchCustomers = async (query) => {
  return await Customer.findAll({
    where: {
      [Op.or]: [
        { customerCode: { [Op.iLike]: `%${query}%` } },
        { mobileNumber: { [Op.iLike]: `%${query}%` } },
        { firstName: { [Op.iLike]: `%${query}%` } },
        { aadharNumber: { [Op.iLike]: `%${query}%` } }
      ]
    }
  });
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomers
};
