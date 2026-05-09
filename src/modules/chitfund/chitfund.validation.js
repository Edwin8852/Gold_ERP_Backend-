const Joi = require('joi');

/**
 * Chit Fund Validation Schemas
 */
const chitfundValidation = {
  create: Joi.object({
    customerId: Joi.string().uuid().required(),
    schemeName: Joi.string().required(),
    monthlyContribution: Joi.number().positive().required(),
    durationMonths: Joi.number().integer().min(1).required(),
    totalValue: Joi.number().positive().required(),
    startDate: Joi.date().optional(),
  }),

  update: Joi.object({
    status: Joi.string().valid('Active', 'Completed', 'Closed').optional(),
    currentInstallment: Joi.number().integer().min(1).optional(),
  }),
};

module.exports = chitfundValidation;
