// const Joi = require('joi');

// /**
//  * Gold Rate Validation Schemas
//  */
// const goldrateValidation = {
//   create: Joi.object({
//     // purity: Joi.string().valid('24K', '22K', '18K').required(),
//     // ratePerGram: Joi.number().positive().required(),
//     currency: Joi.string().length(3).optional(),
//   }),
// };

// module.exports = goldrateValidation;


const Joi = require('joi');

const create = Joi.object({
  gold22kRate: Joi.number().required(),

  gold24kRate: Joi.number().required(),

  date: Joi.string().required(),
});

const update = Joi.object({
  gold22kRate: Joi.number(),

  gold24kRate: Joi.number(),

  date: Joi.string(),
});

module.exports = {
  create,
  update,
};