/**
 * Inventory Transaction Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const InventoryTransaction = sequelize.define('InventoryTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    inventoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'inventory_items',
        key: 'id',
      },
    },
    transactionType: {
      type: DataTypes.ENUM('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    previousStock: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    currentStock: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID of the Jewelry Order or related entity',
    },
  }, {
    timestamps: true,
    tableName: 'inventory_transactions',
  });

  InventoryTransaction.associate = (models) => {
    InventoryTransaction.belongsTo(models.InventoryItem, { foreignKey: 'inventoryId', as: 'inventoryItem' });
    InventoryTransaction.belongsTo(models.User, { foreignKey: 'createdBy', as: 'user' });
  };

  return InventoryTransaction;
};
