module.exports = (sequelize, DataTypes) => {
  const GoldLoan = sequelize.define('GoldLoan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    goldWeight: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    goldPurity: {
      type: DataTypes.STRING,
    },
    loanAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    principalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    remainingPrincipal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    totalPaid: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    interestRate: {
      type: DataTypes.FLOAT,
      defaultValue: 12,
    },
    monthlyInterest: {
      type: DataTypes.FLOAT,
    },
    totalRepayment: {
      type: DataTypes.FLOAT,
    },
    goldValue: {
      type: DataTypes.FLOAT,
    },
    eligibleLoanAmount: {
      type: DataTypes.FLOAT,
    },
    loanToValueRatio: {
      type: DataTypes.FLOAT,
      defaultValue: 0.75,
    },
    loanDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    dueDate: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'PENDING', 'CLOSED', 'OVERDUE'),
      defaultValue: 'ACTIVE',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    }
  }, {
    timestamps: true,
    tableName: 'gold_loans'
  });

  GoldLoan.associate = (models) => {
    GoldLoan.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    GoldLoan.hasMany(models.JewelInspection, { foreignKey: 'loanId', as: 'inspections' });
  };

  return GoldLoan;
};
