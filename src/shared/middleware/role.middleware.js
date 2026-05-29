const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware to authorize specific roles
 * @param  {...string} allowedRoles 
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Debug Logs for RBAC
    console.log("[RBAC] Allowed Roles:", allowedRoles);
    console.log("[RBAC] Current User:", req.user?.email, "Role:", req.user?.role);

    if (!req.user || !req.user.role) {
      console.error("[RBAC] Access Denied: No user or role found in request");
      return ApiResponse.error(res, 'Access denied. You do not have permission to access this resource.', 403);
    }

    // Normalize role for comparison
    const userRole = req.user.role ? req.user.role.toUpperCase() : null;
    const isAllowed = userRole && allowedRoles.some(role => role.toUpperCase() === userRole);

    if (!isAllowed) {
      console.error(`[RBAC] Access Denied for User ID: ${req.user?.id}`);
      console.error(`[RBAC] User Role: '${userRole}' | Required Roles: [${allowedRoles}]`);
      return ApiResponse.error(res, `Access denied. Your role (${userRole}) is not authorized.`, 403);
    }

    console.log("[RBAC] Access Granted");
    next();
  };
};

module.exports = authorizeRoles;
