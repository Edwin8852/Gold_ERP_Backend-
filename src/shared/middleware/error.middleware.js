const ApiResponse = require('../utils/apiResponse');
const logger = require('../../config/logger');

/**
 * Centralized Error Handling Middleware
 * Catches all errors and returns a formatted JSON response with translation support
 */
const errorHandler = (err, req, res, next) => {
  // Determine if it's an operational error (custom AppError) or a programming error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development' || !err.isOperational) {
    logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  } else {
    logger.warn(`Operational Error: ${err.message}`);
  }

  // Handle Translation if available
  if (req.t) {
    if (statusCode === 500) message = req.t('internalServer', { ns: 'error', defaultValue: message });
    else if (statusCode === 401) message = req.t('unauthorized', { ns: 'error', defaultValue: message });
    else if (statusCode === 403) message = req.t('forbidden', { ns: 'error', defaultValue: message });
    else if (statusCode === 404) message = req.t('notFound', { ns: 'error', defaultValue: message });
  }

  // Handle Sequelize Unique Constraint Errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = err.errors.map((e) => e.message).join(', ');
  }

  // Handle Joi/Zod Validation Errors
  if (err.isJoi || err.name === 'ZodError') {
    statusCode = 400;
    message = err.details ? err.details.map((d) => d.message).join(', ') : err.message;
  }

  return ApiResponse.error(res, message, statusCode, (process.env.NODE_ENV === 'development' && !err.isOperational) ? err.stack : undefined);
};


module.exports = errorHandler;
