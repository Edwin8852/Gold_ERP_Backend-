/**
 * Notification Model Definition
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
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.STRING,
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

  Notification.associate = (models) => {
    Notification.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  };

  return Notification;
};
