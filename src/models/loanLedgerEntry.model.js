module.exports = (sequelize, DataTypes) => {
  const LoanLedgerEntry = sequelize.define('LoanLedgerEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'loan_id'
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_id'
    },
    transactionType: {
      type: DataTypes.ENUM('LOAN_CREATION', 'INTEREST_PAYMENT', 'PRINCIPAL_PAYMENT', 'PENALTY', 'CLOSURE', 'ORNAMENT_RELEASE'),
      allowNull: false,
      field: 'transaction_type'
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'balance_after'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    timestamps: true,
    tableName: 'loan_ledger_entries'
  });

  LoanLedgerEntry.associate = (models) => {
    LoanLedgerEntry.belongsTo(models.GoldLoan, { foreignKey: 'loanId', as: 'loan' });
    LoanLedgerEntry.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  };

  return LoanLedgerEntry;
};
