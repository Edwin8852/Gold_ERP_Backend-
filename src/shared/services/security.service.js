const { LoginLog, AuditLog, User } = require('../../models');

class SecurityService {
  /**
   * Log a login attempt
   */
  async logLogin(userId, status, req) {
    try {
      await LoginLog.create({
        userId,
        status,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    } catch (error) {
      console.error('[Security Service] Failed to log login:', error.message);
    }
  }

  /**
   * Log a data mutation (Audit Log)
   */
  async logAction(userId, action, module, targetId, oldData, newData, req) {
    try {
      await AuditLog.create({
        userId,
        action,
        module,
        targetId,
        oldData,
        newData,
        ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress,
      });
    } catch (error) {
      console.error('[Security Service] Failed to log action:', error.message);
    }
  }

  /**
   * Get Recent Security Activity (Executive Dashboard)
   */
  async getRecentActivity(limit = 10) {
    const [logins, audits] = await Promise.all([
      LoginLog.findAll({
        limit,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'role'] }]
      }),
      AuditLog.findAll({
        limit,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'role'] }]
      })
    ]);

    return { logins, audits };
  }
}

module.exports = new SecurityService();
