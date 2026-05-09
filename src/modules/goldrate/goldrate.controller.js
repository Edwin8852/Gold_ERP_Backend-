const GoldRateService = require('./goldrate.service');

/**
 * Create Gold Rate
 */
const create = async (req, res, next) => {

  try {

    const result =
      await GoldRateService.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Gold rate created successfully',
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get All Gold Rates
 */
const getAll = async (req, res, next) => {

  try {

    const result =
      await GoldRateService.getAll();

    res.status(200).json({
      success: true,
      message: 'Gold rates retrieved successfully',
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get Gold Rate By ID
 */
const getById = async (req, res, next) => {

  try {

    const result =
      await GoldRateService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update Gold Rate
 */
const update = async (req, res, next) => {

  try {

    const result =
      await GoldRateService.update(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: 'Gold rate updated successfully',
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete Gold Rate
 */
const deleteGoldRate = async (req, res, next) => {

  try {

    await GoldRateService.deleteGoldRate(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Gold rate deleted successfully',
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  deleteGoldRate,
};