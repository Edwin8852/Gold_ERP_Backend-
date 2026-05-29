module.exports = (sequelize, DataTypes) => {
  const LoanPaymentHistory = sequelize.define('LoanPaymentHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanPaymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'loan_payment_id'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'action'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'remarks'
    },
    oldStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'old_status'
    },
    newStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'new_status'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by'
    }
  }, {
    timestamps: true,
    tableName: 'loan_payment_history'
  });

  LoanPaymentHistory.associate = (models) => {
    LoanPaymentHistory.belongsTo(models.LoanPayment, { foreignKey: 'loanPaymentId', as: 'loanPayment' });
    LoanPaymentHistory.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  return LoanPaymentHistory;
};
