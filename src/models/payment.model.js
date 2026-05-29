module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'loanId'
    },
    beforeBalance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'beforeBalance'
    },
    afterBalance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'afterBalance'
    },
    paymentAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'paymentAmount'
    },
    paymentType: {
      type: DataTypes.ENUM('EMI', 'INTEREST_ONLY', 'PRINCIPAL_ONLY', 'FULL_CLOSURE'),
      defaultValue: 'EMI',
      field: 'paymentType'
    },
    penaltyAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'penaltyAmount'
    },
    paymentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'paymentDate'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      defaultValue: 'CASH',
      field: 'paymentMethod'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'SUCCESS',
    },
    principalPaid: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'principalPaid'
    },
    interestPaid: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'interestPaid'
    },
    penaltyPaid: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'penaltyPaid'
    },
    paymentStatus: {
      type: DataTypes.STRING,
      defaultValue: 'ACTIVE',
      field: 'paymentStatus'
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'remainingBalance'
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      field: 'invoiceNumber'
    },
    invoiceUrl: {
      type: DataTypes.STRING,
      field: 'invoiceUrl'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'createdBy'
    }
  }, {
    timestamps: true,
    tableName: 'payments'
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.GoldLoan, { foreignKey: 'loanId', as: 'loan' });
    Payment.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };


  return Payment;
};

