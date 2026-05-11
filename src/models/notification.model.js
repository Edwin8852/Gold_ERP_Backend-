/**
 * Notification Model Definition
 * SDRS Gold Finance & Jewelry ERP System
 */

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM(
        'DUE_REMINDER',
        'PAYMENT_ALERT',
        'CHIT_FUND_ALERT',
        'CHIT_FUND_COMPLETION',
        'GOLD_LOAN_INTEREST'
      ),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
  });

  return Notification;
};
