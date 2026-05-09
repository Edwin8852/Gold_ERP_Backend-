const jewelryService = require('./jewelry.service');
const response = require('../../shared/utils/response');

exports.createOrder = async (req, res, next) => {
  try {
    const order = await jewelryService.create(req.body);
    return response.success(res, 'Jewelry order created', order, 201);
  } catch (error) {
    next(error);
  }
};
