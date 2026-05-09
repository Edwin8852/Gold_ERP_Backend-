const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');

/**
 * JWT Authentication Middleware
 * Protects routes by verifying the token
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(res, 'Authentication required. Please provide a token.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request object
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Invalid or expired token.', 401);
  }
};

module.exports = authMiddleware;
