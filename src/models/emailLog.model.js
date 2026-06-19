const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const EmailLog = sequelize.define('EmailLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  notificationType: {
    type: DataTypes.STRING,
    allowNull: false,
    // e.g., 'LOAN_CLOSURE', 'ORNAMENT_RELEASE'
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  loanId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  sentStatus: {
    type: DataTypes.ENUM('SUCCESS', 'FAILED'),
    allowNull: false,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'email_logs',
  timestamps: true,
});

module.exports = EmailLog;
