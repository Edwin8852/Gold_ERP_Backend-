/**
 * Jewelry Order Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    ornamentType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    purity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    grossWeight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    goldRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    wastagePercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    wastageAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    makingChargePerGram: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    makingChargeAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalGST: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    finalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    advanceAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    balanceAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PENDING_ADVANCE', 'ADVANCE_PAID', 'IN_PRODUCTION', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'),
      defaultValue: 'DRAFT',
    },
    paymentMethod: {
      type: DataTypes.ENUM('ONLINE', 'CASH', 'CARD', 'BANK_TRANSFER'),
      defaultValue: 'CASH',
    },
    paymentStatus: {
      type: DataTypes.ENUM('PENDING', 'PENDING_CASH_COLLECTION', 'ADVANCE_PAID', 'PAID'),
      defaultValue: 'PENDING',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    statusChangedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    paymentConfirmedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    statusUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deliveryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'jewelry_orders',
  });

  Order.associate = (models) => {
    Order.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  };

  return Order;
};

