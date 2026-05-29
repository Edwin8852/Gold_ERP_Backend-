/**
 * Chit Subscriber Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const ChitSubscriber = sequelize.define('ChitSubscriber', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schemeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'schemeId',
      references: {
        model: 'chit_schemes',
        key: 'id',
      },
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customerId',
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    joiningDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
      field: 'joiningDate'
    },
    ticketNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'ticketNumber'
    },
    totalPaid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      field: 'totalPaid'
    },
    pendingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      field: 'pendingAmount'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'DEFAULTED', 'WITHDRAWN', 'COMPLETED'),
      defaultValue: 'ACTIVE',
    },
    currentStatus: {
      type: DataTypes.ENUM('PARTIAL_PAID', 'FULLY_PAID', 'INSTALLMENT_PAID', 'PENDING', 'OVERDUE'),
      allowNull: true,
      defaultValue: 'PENDING',
      field: 'currentStatus',
    },
    totalPaidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00,
      field: 'totalPaidAmount',
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00,
      field: 'remainingAmount',
    },
    completedInstallments: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'completedInstallments',
    },
    pendingInstallments: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'pendingInstallments',
    },
    lastPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'lastPaymentDate',
    },
    nextDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'nextDueDate',
    }
  }, {
    tableName: 'chit_subscribers',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['schemeId', 'ticketNumber']
      },
      {
        unique: true,
        fields: ['schemeId', 'customerId']
      }
    ]
  });

  ChitSubscriber.associate = (models) => {
    ChitSubscriber.belongsTo(models.ChitScheme, { foreignKey: 'schemeId', as: 'scheme' });
    ChitSubscriber.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    ChitSubscriber.hasMany(models.ChitInstallment, { foreignKey: 'subscriberId', as: 'installments' });
  };

  return ChitSubscriber;
};
