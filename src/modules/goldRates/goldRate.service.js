const GoldRate = require('../../models/goldRate.model');

const createGoldRate = async (rateData, userId) => {
  // Deactivate all old rates
  await GoldRate.update({ status: 'INACTIVE' }, { where: { status: 'ACTIVE' } });

  // Create new active rate
  const rate = await GoldRate.create({
    ...rateData,
    status: 'ACTIVE',
    createdBy: userId,
  });

  return rate;
};

const getCurrentRate = async () => {
  const rate = await GoldRate.findOne({
    where: { status: 'ACTIVE' },
    order: [['createdAt', 'DESC']],
  });
  if (!rate) throw new Error('Active gold rate not found. Please set daily rate.');
  return rate;
};

const getHistory = async () => {
  return await GoldRate.findAll({ order: [['createdAt', 'DESC']] });
};

const getRateById = async (id) => {
  const rate = await GoldRate.findByPk(id);
  if (!rate) throw new Error('Gold rate record not found');
  return rate;
};

const updateGoldRate = async (id, updateData) => {
  const rate = await getRateById(id);
  await rate.update(updateData);
  return rate;
};

const deleteGoldRate = async (id) => {
  const rate = await getRateById(id);
  await rate.destroy();
  return true;
};

const calculateValuation = (weight, purity, activeRate) => {
  const rate = purity === '24K' ? activeRate.gold24KRate : activeRate.gold22KRate;
  const goldValue = weight * rate;
  const eligibleLoanAmount = goldValue * 0.75; // 75% LTV
  return { goldValue, eligibleLoanAmount, rateUsed: rate };
};

module.exports = {
  createGoldRate,
  getCurrentRate,
  getHistory,
  getRateById,
  updateGoldRate,
  deleteGoldRate,
  calculateValuation
};
