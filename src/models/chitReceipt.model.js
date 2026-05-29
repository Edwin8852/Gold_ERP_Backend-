module.exports = (sequelize, DataTypes) => {
  const ChitReceipt = sequelize.define('ChitReceipt', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chitFundPaymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    receiptNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    generatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    generatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    }
  }, {
    timestamps: true,
    tableName: 'chit_receipts'
  });

  ChitReceipt.associate = (models) => {
    ChitReceipt.belongsTo(models.ChitFundPayment, { foreignKey: 'chitFundPaymentId', as: 'chitFundPayment' });
    ChitReceipt.belongsTo(models.User, { foreignKey: 'generatedBy', as: 'generator' });
  };

  return ChitReceipt;
};
