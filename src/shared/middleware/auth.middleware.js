const { verifyToken } = require('../utils/jwt');
const ApiResponse = require('../utils/apiResponse');

/**
 * JWT Authentication Middleware
 * Protects routes by verifying the token
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(res, 'Authentication required. Please provide a token.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Attach user info to request object
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Invalid or expired token.', 401);
  }
};

module.exports = authMiddleware;
