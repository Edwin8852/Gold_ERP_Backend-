/**
 * Support Ticket Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define('Ticket', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('GOLD_LOAN', 'CHIT_FUND', 'PAYMENT', 'KYC', 'OTHER'),
      defaultValue: 'OTHER',
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      defaultValue: 'MEDIUM',
    },
    status: {
      type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
      defaultValue: 'OPEN',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    adminResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'adminResponse'
    },
    resolvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'resolvedBy',
      references: {
        model: 'users',
        key: 'id',
      },
    }
  }, {
    tableName: 'tickets',
    timestamps: true,
  });

  Ticket.associate = (models) => {
    Ticket.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Ticket.belongsTo(models.User, { foreignKey: 'resolvedBy', as: 'resolver' });
  };

  return Ticket;
};
