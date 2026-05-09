const { JewelryOrder } = require('../../models');

exports.create = async (data) => {
  return await JewelryOrder.create(data);
};
