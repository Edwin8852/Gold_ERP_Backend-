const Joi = require('joi');

/**
 * Customer Validation Schemas
 * Enterprise-grade validation for banking & finance applications
 */
const customerValidation = {
  create: Joi.object({
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters'
    }),
    lastName: Joi.string().allow('', null).optional(),
    email: Joi.string().email().allow('', null).optional().messages({
      'string.email': 'Please enter a valid email address'
    }),
    mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
      'string.pattern.base': 'Mobile number must be exactly 10 numeric digits',
      'string.empty': 'Mobile number is required'
    }),
    address: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    pincode: Joi.string().allow('', null).optional(),
    aadharNumber: Joi.string().pattern(/^[0-9]{12}$/).allow('', null).optional().messages({
      'string.pattern.base': 'Aadhaar number must be exactly 12 numeric digits'
    }),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).allow('', null).optional().messages({
      'string.pattern.base': 'Invalid PAN format (Example: ABCDE1234F)'
    }),
  }),

  update: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().allow('', null).optional(),
    email: Joi.string().email().allow('', null).optional(),
    mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    address: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    pincode: Joi.string().allow('', null).optional(),
    aadharNumber: Joi.string().pattern(/^[0-9]{12}$/).allow('', null).optional(),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).allow('', null).optional(),
    kycStatus: Joi.string().valid('PENDING', 'VERIFIED', 'REJECTED').optional(),
  }),
};

module.exports = customerValidation;
