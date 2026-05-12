module.exports = (sequelize, DataTypes) => {
  const Ledger = sequelize.define('Ledger', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionType: {
      type: DataTypes.ENUM('DEBIT', 'CREDIT'),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'INTEREST_PAYMENT', 'EXPENSE', 'INCOME', 'OTHER'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    runningBalance: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    paymentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    }
  }, {
    timestamps: true,
    tableName: 'ledgers',
  });

  Ledger.associate = (models) => {
    Ledger.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Ledger.belongsTo(models.GoldLoan, { foreignKey: 'loanId', as: 'loan' });
    if (models.Payment) Ledger.belongsTo(models.Payment, { foreignKey: 'paymentId', as: 'payment' });
  };

  return Ledger;
};
