const express = require('express');

const router = express.Router();

const GoldRateController = require('./goldrate.controller');

const goldrateValidation = require('./goldrate.validation');

/**
 * Validation Middleware
 */
const validate = (schema) => (req, res, next) => {

  const { error } = schema.validate(req.body);

  if (error) return next(error);

  next();
};

/**
 * Create Gold Rate
 */
router.post(
  '/',
  validate(goldrateValidation.create),
  GoldRateController.create
);

/**
 * Get All Gold Rates
 */
router.get(
  '/',
  GoldRateController.getAll
);

/**
 * Get Gold Rate By ID
 */
router.get(
  '/:id',
  GoldRateController.getById
);

/**
 * Update Gold Rate
 */
router.put(
  '/:id',
  validate(goldrateValidation.update),
  GoldRateController.update
);

/**
 * Delete Gold Rate
 */
router.delete(
  '/:id',
  GoldRateController.deleteGoldRate
);

module.exports = router;