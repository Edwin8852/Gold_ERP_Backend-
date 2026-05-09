module.exports = (sequelize, DataTypes) => {
  const JewelryOrder = sequelize.define('JewelryOrder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    itemDescription: DataTypes.TEXT,
    weight: DataTypes.DECIMAL(10, 2),
    totalPrice: DataTypes.DECIMAL(10, 2),
    status: DataTypes.STRING
  });

  return JewelryOrder;
};
