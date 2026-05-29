const { verifyToken } = require('../utils/jwt');
const ApiResponse = require('../utils/apiResponse');

/**
 * JWT Authentication Middleware
 * Protects routes by verifying the token
 */
const authMiddleware = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return ApiResponse.error(res, 'Authentication required. Please provide a token.', 401);
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Attach user info to request object
    
    // Debug log for authentication
    console.log("[Auth] Authenticated User ID:", decoded.id, "Role:", decoded.role);
    
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Invalid or expired token.', 401);
  }
};

module.exports = authMiddleware;
