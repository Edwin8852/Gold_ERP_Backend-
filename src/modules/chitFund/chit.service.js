const { ChitFund } = require('../../models');

exports.join = async (data) => {
  return await ChitFund.create(data);
};
