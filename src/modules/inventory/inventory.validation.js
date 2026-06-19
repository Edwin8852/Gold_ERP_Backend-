const Joi = require('joi');

const inventoryValidation = {
  addStock: Joi.object({
    itemName: Joi.string().required(),
    purity: Joi.string().required(),
    unit: Joi.string().valid('Gram', 'Kg', 'Piece').required(),
    quantity: Joi.number().positive().required(),
    transactionType: Joi.string().valid('STOCK_IN', 'ADJUSTMENT').required(),
    purchaseRate: Joi.number().min(0).optional(),
    remarks: Joi.string().allow('', null).optional(),
  }),

  queryStock: Joi.object({
    search: Joi.string().allow('', null).optional(),
    purity: Joi.string().allow('', null).optional(),
  }),

  queryHistory: Joi.object({
    search: Joi.string().allow('', null).optional(),
    transactionType: Joi.string().valid('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'ALL').optional(),
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
  })
};

module.exports = inventoryValidation;
