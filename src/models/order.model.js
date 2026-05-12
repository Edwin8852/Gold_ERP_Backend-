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
    jewelryType: {
      type: DataTypes.STRING, // e.g., Ring, Necklace, Bangle
      allowNull: false,
    },
    weight: {
      type: DataTypes.DECIMAL(10, 3), // e.g., 10.500 grams
      allowNull: false,
    },
    purity: {
      type: DataTypes.STRING, // e.g., 22K, 18K
      allowNull: false,
    },
    goldRateAtPurchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    makingCharges: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Processing', 'Completed', 'Cancelled'),
      defaultValue: 'Pending',
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
    tableName: 'jewelry_orders',
  });

  Order.associate = (models) => {
    Order.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
  };

  return Order;
};
