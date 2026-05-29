module.exports = (sequelize, DataTypes) => {
  const LoanReceipt = sequelize.define('LoanReceipt', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanPaymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'loan_payment_id'
    },
    receiptNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'receipt_number'
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'receipt_url'
    },
    generatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'generated_at'
    },
    generatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'generated_by'
    }
  }, {
    timestamps: true,
    tableName: 'loan_receipts'
  });

  LoanReceipt.associate = (models) => {
    LoanReceipt.belongsTo(models.LoanPayment, { foreignKey: 'loanPaymentId', as: 'loanPayment' });
    LoanReceipt.belongsTo(models.User, { foreignKey: 'generatedBy', as: 'generator' });
  };

  return LoanReceipt;
};
