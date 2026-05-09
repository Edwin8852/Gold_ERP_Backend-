const Joi = require('joi');

/**
 * Order Validation Schemas
 */
const orderValidation = {
  create: Joi.object({
    customerId: Joi.string().uuid().required(),
    jewelryType: Joi.string().required(),
    weight: Joi.number().precision(3).positive().required(),
    purity: Joi.string().required(),
    goldRateAtPurchase: Joi.number().positive().required(),
    makingCharges: Joi.number().min(0).optional(),
    totalAmount: Joi.number().positive().required(),
    status: Joi.string().valid('Pending', 'Processing', 'Completed', 'Cancelled').optional(),
  }),

  update: Joi.object({
    status: Joi.string().valid('Pending', 'Processing', 'Completed', 'Cancelled').optional(),
    jewelryType: Joi.string().optional(),
    weight: Joi.number().precision(3).positive().optional(),
    totalAmount: Joi.number().positive().optional(),
  }),
};

module.exports = orderValidation;
