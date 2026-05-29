module.exports = (sequelize, DataTypes) => {
  const GoldMarketRate = sequelize.define('GoldMarketRate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    gold_24k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'gold_24k',
    },
    gold_22k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'gold_22k',
    },
    gold_18k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'gold_18k',
    },
    silver_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'silver_rate',
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'source',
    },
    market_status: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'market_status',
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'gold_market_rates'
  });

  return GoldMarketRate;
};
