/**
 * Chit Auction Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const ChitAuction = sequelize.define('ChitAuction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schemeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chit_schemes',
        key: 'id',
      },
    },
    winnerSubscriberId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chit_subscribers',
        key: 'id',
      },
    },
    monthNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    auctionDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    bidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'The discount amount offered by the winner'
    },
    prizeAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Chit Value - Bid Amount'
    },
    dividendAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'Bid Amount distributed among members'
    },
    foremanCommission: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'COMPLETED',
    }
  }, {
    tableName: 'chit_auctions',
    timestamps: true,
  });

  ChitAuction.associate = (models) => {
    ChitAuction.belongsTo(models.ChitScheme, { foreignKey: 'schemeId', as: 'scheme' });
    ChitAuction.belongsTo(models.ChitSubscriber, { foreignKey: 'winnerSubscriberId', as: 'winner' });
    ChitAuction.hasMany(models.ChitDividend, { foreignKey: 'auctionId', as: 'dividends' });
  };

  return ChitAuction;
};
