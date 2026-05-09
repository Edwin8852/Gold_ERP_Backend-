const goldRateService = require('./goldRate.service');

const createRate = async (req, res) => {
  try {
    const rate = await goldRateService.createGoldRate(req.body, req.user.id);
    return res.status(201).json({
      success: true,
      message: 'Gold rate created successfully and activated',
      data: rate,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getCurrentActiveRate = async (req, res) => {
  try {
    const rate = await goldRateService.getCurrentRate();
    return res.status(200).json({ success: true, data: rate });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const getRateHistory = async (req, res) => {
  try {
    const history = await goldRateService.getHistory();
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getRate = async (req, res) => {
  try {
    const rate = await goldRateService.getRateById(req.params.id);
    return res.status(200).json({ success: true, data: rate });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const updateRate = async (req, res) => {
  try {
    const rate = await goldRateService.updateGoldRate(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Gold rate updated successfully',
      data: rate,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRate = async (req, res) => {
  try {
    await goldRateService.deleteGoldRate(req.params.id);
    return res.status(200).json({ success: true, message: 'Gold rate deleted successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRate,
  getCurrentActiveRate,
  getRateHistory,
  getRate,
  updateRate,
  deleteRate
};
