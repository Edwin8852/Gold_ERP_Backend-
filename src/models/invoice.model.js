module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
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
    paymentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'paymentId'
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'invoiceNumber'
    },
    invoiceType: {
      type: DataTypes.ENUM('LOAN_CREATED', 'PAYMENT_RECEIVED', 'LOAN_CLOSED'),
      allowNull: false,
      field: 'invoiceType'
    },
    oldBalance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'oldBalance'
    },
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'paidAmount'
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'remainingBalance'
    },
    interestAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'interestAmount'
    },
    pendingAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'pendingAmount'
    },
    totalPaid: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'totalPaid'
    },
    generatedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'generatedDate'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'createdBy'
    }
  }, {
    timestamps: true,
    tableName: 'invoices'
  });

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.GoldLoan, { foreignKey: 'loanId', as: 'loan' });
    Invoice.belongsTo(models.Payment, { foreignKey: 'paymentId', as: 'payment' });
  };

  return Invoice;
};
