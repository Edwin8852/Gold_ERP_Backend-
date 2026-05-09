// const { GoldRate } = require('../../models');

// /**
//  * Gold Rate Service
//  */
// class GoldRateService {
//   async updateRate(data) {
//     return await GoldRate.create(data);
//   }

//   async getLatestRates() {
//     // Get the latest rate for each purity
//     const purities = ['24K', '22K', '18K'];
//     const latestRates = await Promise.all(
//       purities.map(async (p) => {
//         return await GoldRate.findOne({
//           where: { purity: p },
//           order: [['effectiveDate', 'DESC']],
//         });
//       })
//     );
//     return latestRates.filter(r => r !== null);
//   }

//   async getHistory(purity) {
//     const where = purity ? { purity } : {};
//     return await GoldRate.findAll({
//       where,
//       order: [['effectiveDate', 'DESC']],
//       limit: 30, // Last 30 entries
//     });
//   }
// }

// module.exports = new GoldRateService();


const { GoldRate } = require('../../models');

const create = async (payload) => {

  const goldRate = await GoldRate.create(payload);

  return goldRate;
};

const getAll = async () => {

  const goldRates = await GoldRate.findAll();

  return goldRates;
};

const getById = async (id) => {

  const goldRate = await GoldRate.findByPk(id);

  if (!goldRate) {
    throw new Error('Gold rate not found');
  }

  return goldRate;
};

const update = async (id, payload) => {

  const goldRate = await GoldRate.findByPk(id);

  if (!goldRate) {
    throw new Error('Gold rate not found');
  }

  await goldRate.update(payload);

  return goldRate;
};

const deleteGoldRate = async (id) => {

  const goldRate = await GoldRate.findByPk(id);

  if (!goldRate) {
    throw new Error('Gold rate not found');
  }

  await goldRate.destroy();

  return true;
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  deleteGoldRate,
};