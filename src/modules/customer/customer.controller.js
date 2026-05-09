const customerService = require('./customer.service');

const createCustomer = async (req, res) => {
  try {
    const customer = await customerService.createCustomer(req.body, req.user.id);
    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getCustomers = async (req, res) => {
  try {
    const customers = await customerService.getAllCustomers();
    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomer = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    return res.status(200).json({ success: true, data: customer });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    await customerService.deleteCustomer(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    const customers = await customerService.searchCustomers(q);
    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
};
