/**
 * Inventory Item Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const InventoryItem = sequelize.define('InventoryItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    purity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Gram',
    },
    currentStock: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    minimumStock: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    timestamps: true,
    tableName: 'inventory_items',
  });

  InventoryItem.associate = (models) => {
    InventoryItem.hasMany(models.InventoryTransaction, { foreignKey: 'inventoryId', as: 'transactions' });
  };

  return InventoryItem;
};
