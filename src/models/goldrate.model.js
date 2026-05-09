module.exports = (sequelize, DataTypes) => {

  const GoldRate = sequelize.define(
    'GoldRate',
    {

      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      gold22kRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      gold24kRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

    },
    {
      tableName: 'gold_rates',
      timestamps: true,
    }
  );

  return GoldRate;
};