const ApiResponse = require('../utils/apiResponse');

/**
 * Centralized Error Handling Middleware
 * Catches all errors and returns a formatted JSON response
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error]: ${err.message}`);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Sequelize Unique Constraint Errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = err.errors.map((e) => e.message).join(', ');
  }

  // Handle Joi Validation Errors
  if (err.isJoi) {
    statusCode = 400;
    message = err.details.map((d) => d.message).join(', ');
  }

  return ApiResponse.error(res, message, statusCode);
};

module.exports = errorHandler;
