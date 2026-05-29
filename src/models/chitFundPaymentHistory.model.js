module.exports = (sequelize, DataTypes) => {
  const ChitFundPaymentHistory = sequelize.define('ChitFundPaymentHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chitFundPaymentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    oldStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    newStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    }
  }, {
    timestamps: true,
    tableName: 'chit_fund_payment_history'
  });

  ChitFundPaymentHistory.associate = (models) => {
    ChitFundPaymentHistory.belongsTo(models.ChitFundPayment, { foreignKey: 'chitFundPaymentId', as: 'chitFundPayment' });
    ChitFundPaymentHistory.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  return ChitFundPaymentHistory;
};
