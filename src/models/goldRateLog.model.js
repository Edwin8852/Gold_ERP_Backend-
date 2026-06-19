module.exports = (sequelize, DataTypes) => {
  const GoldRateLog = sequelize.define(
    "GoldRateLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      status: {
        type: DataTypes.ENUM('SUCCESS', 'FAILED', 'PENDING'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      source: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lastUpdated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "gold_rate_logs",
      timestamps: true,
    }
  );

  return GoldRateLog;
};
