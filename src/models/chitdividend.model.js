/**
 * Chit Dividend Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const ChitDividend = sequelize.define('ChitDividend', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    auctionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chit_auctions',
        key: 'id',
      },
    },
    subscriberId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chit_subscribers',
        key: 'id',
      },
    },
    dividendAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ADJUSTED', 'PAID'),
      defaultValue: 'PENDING'
    }
  }, {
    tableName: 'chit_dividends',
    timestamps: true,
  });

  ChitDividend.associate = (models) => {
    ChitDividend.belongsTo(models.ChitAuction, { foreignKey: 'auctionId', as: 'auction' });
    ChitDividend.belongsTo(models.ChitSubscriber, { foreignKey: 'subscriberId', as: 'subscriber' });
  };

  return ChitDividend;
};
