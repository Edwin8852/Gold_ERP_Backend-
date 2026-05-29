module.exports = (sequelize, DataTypes) => {
  const LoanLedger = sequelize.define('LoanLedger', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'loan_id'
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_id'
    },
    totalLoanAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'total_loan_amount'
    },
    totalPaidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'total_paid_amount'
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'remaining_balance'
    },
    totalInterestPaid: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'total_interest_paid'
    },
    totalPenaltyPaid: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'total_penalty_paid'
    },
    nextDueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_due_date'
    },
    lastPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_payment_date'
    }
  }, {
    timestamps: true,
    tableName: 'loan_ledger'
  });

  LoanLedger.associate = (models) => {
    LoanLedger.belongsTo(models.GoldLoan, { foreignKey: 'loanId', as: 'loan' });
    LoanLedger.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  };

  return LoanLedger;
};
