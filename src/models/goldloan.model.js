/**
 * Gold Loan Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const GoldLoan = sequelize.define('GoldLoan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    loanAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    lastInterestPaidDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    nextDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Closed', 'Defaulted'),
      defaultValue: 'Active',
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
  }, {
    timestamps: true,
    tableName: 'gold_loans',
  });

  return GoldLoan;
};
