module.exports = (sequelize, DataTypes) => {
  const ChitFundPayment = sequelize.define('ChitFundPayment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chitSubscriberId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    paymentType: {
      type: DataTypes.ENUM('MONTHLY_INSTALLMENT', 'ADVANCE_PAYMENT', 'MISSED_PAYMENT', 'BONUS_PAYMENT'),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'MANUAL_ENTRY'),
      defaultValue: 'CASH',
    },
    paymentSource: {
      type: DataTypes.ENUM('ADMIN_COLLECTION', 'ONLINE_PAYMENT', 'WALK_IN_PAYMENT'),
      defaultValue: 'ADMIN_COLLECTION',
    },
    amountPaid: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    installmentMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    penaltyWaiver: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    paymentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    outstandingPendingAfter: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED', 'PENDING', 'REVERTED'),
      defaultValue: 'SUCCESS',
    },
    referenceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    installmentNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'installmentNumber',
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'remainingBalance',
    },
    paymentStatus: {
      type: DataTypes.ENUM('PARTIAL_PAID', 'FULLY_PAID', 'INSTALLMENT_PAID', 'PENDING', 'OVERDUE'),
      allowNull: true,
      field: 'paymentStatus',
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'invoiceNumber',
    },
    invoiceUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'invoiceUrl',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    }
  }, {
    timestamps: true,
    tableName: 'chit_fund_payments'
  });

  ChitFundPayment.associate = (models) => {
    ChitFundPayment.belongsTo(models.ChitSubscriber, { foreignKey: 'chitSubscriberId', as: 'subscriber' });
    ChitFundPayment.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  return ChitFundPayment;
};
