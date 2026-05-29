/**
 * Chit Installment Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const ChitInstallment = sequelize.define('ChitInstallment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subscriberId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chit_subscribers',
        key: 'id',
      },
    },
    installmentNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    payableAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
    },
    penaltyAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'),
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PAID', 'OVERDUE', 'PARTIAL'),
      defaultValue: 'PENDING',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dividendAdjusted: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
    }
  }, {
    tableName: 'chit_installments',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['subscriberId', 'installmentNumber']
      }
    ]
  });

  ChitInstallment.associate = (models) => {
    ChitInstallment.belongsTo(models.ChitSubscriber, { foreignKey: 'subscriberId', as: 'subscriber' });
  };

  return ChitInstallment;
};
