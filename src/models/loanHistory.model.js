module.exports = (sequelize, DataTypes) => {
  const LoanHistory = sequelize.define('LoanHistory', {
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
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'action'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'remarks'
    }
  }, {
    timestamps: true,
    tableName: 'loan_histories'
  });

  LoanHistory.associate = (models) => {
    LoanHistory.belongsTo(models.GoldLoan, { foreignKey: 'loanId', as: 'loan' });
  };

  return LoanHistory;
};
