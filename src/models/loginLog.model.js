/**
 * LoginLog Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const LoginLog = sequelize.define('LoginLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED'),
      defaultValue: 'SUCCESS',
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    tableName: 'login_logs',
    timestamps: true,
    updatedAt: false,
  });

  LoginLog.associate = (models) => {
    LoginLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return LoginLog;
};
