const Joi = require('joi');

/**
 * Customer Validation Schemas
 */
const customerValidation = {
  create: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).allow('', null).optional(),
    email: Joi.string().email().allow('', null).optional(),
    mobileNumber: Joi.string().min(10).max(15).required(),
    address: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    pincode: Joi.string().allow('', null).optional(),
    aadharNumber: Joi.string().allow('', null).optional(),
    panNumber: Joi.string().allow('', null).optional(),
  }),

  update: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).allow('', null).optional(),
    email: Joi.string().email().allow('', null).optional(),
    mobileNumber: Joi.string().min(10).max(15).optional(),
    address: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    pincode: Joi.string().allow('', null).optional(),
    aadharNumber: Joi.string().allow('', null).optional(),
    panNumber: Joi.string().allow('', null).optional(),
    kycStatus: Joi.string().valid('PENDING', 'VERIFIED', 'REJECTED').optional(),
  }),
};

module.exports = customerValidation;
