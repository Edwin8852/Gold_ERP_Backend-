module.exports = (sequelize, DataTypes) => {
  const LiveRate = sequelize.define('LiveRate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    gold18k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    gold22k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    gold24k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    silver: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    isLive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: 'API'
    }
  }, {
    timestamps: true,
    tableName: 'live_rates'
  });

  return LiveRate;
};
