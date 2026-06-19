const Joi = require('joi');

const orderValidation = {
  create: Joi.object({
    customerId: Joi.string().uuid().required(),
    ornamentType: Joi.string().required(),
    purity: Joi.string().required(),
    grossWeight: Joi.number().precision(3).positive().required(),
    goldRate: Joi.number().positive().required(),
    wastagePercent: Joi.number().min(0).optional(),
    wastageAmount: Joi.number().min(0).optional(),
    makingChargePerGram: Joi.number().min(0).optional(),
    makingChargeAmount: Joi.number().min(0).optional(),
    totalGST: Joi.number().min(0).optional(),
    finalAmount: Joi.number().positive().required(),
    advanceAmount: Joi.number().min(0).optional(),
    balanceAmount: Joi.number().min(0).optional(),
    status: Joi.string().valid('DRAFT', 'PENDING_ADVANCE', 'ADVANCE_PAID', 'IN_PRODUCTION', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED').optional(),
    paymentMethod: Joi.string().valid('ONLINE', 'CASH', 'CARD', 'BANK_TRANSFER').optional(),
    paymentStatus: Joi.string().valid('PENDING', 'PENDING_CASH_COLLECTION', 'ADVANCE_PAID', 'PAID').optional(),
    remarks: Joi.string().allow('', null).optional(),
    deliveryDate: Joi.date().allow('', null).optional(),
  }).unknown(true),

  update: Joi.object({
    customerId: Joi.string().uuid().optional(),
    ornamentType: Joi.string().optional(),
    purity: Joi.string().optional(),
    grossWeight: Joi.number().precision(3).positive().optional(),
    goldRate: Joi.number().positive().optional(),
    wastagePercent: Joi.number().min(0).optional(),
    wastageAmount: Joi.number().min(0).optional(),
    makingChargePerGram: Joi.number().min(0).optional(),
    makingChargeAmount: Joi.number().min(0).optional(),
    totalGST: Joi.number().min(0).optional(),
    finalAmount: Joi.number().positive().optional(),
    advanceAmount: Joi.number().min(0).optional(),
    balanceAmount: Joi.number().min(0).optional(),
    status: Joi.string().valid('DRAFT', 'PENDING_ADVANCE', 'ADVANCE_PAID', 'IN_PRODUCTION', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED').optional(),
    paymentMethod: Joi.string().valid('ONLINE', 'CASH', 'CARD', 'BANK_TRANSFER').optional(),
    paymentStatus: Joi.string().valid('PENDING', 'PENDING_CASH_COLLECTION', 'ADVANCE_PAID', 'PAID').optional(),
    remarks: Joi.string().allow('', null).optional(),
    deliveryDate: Joi.date().allow('', null).optional(),
  }).unknown(true),
};

module.exports = orderValidation;
