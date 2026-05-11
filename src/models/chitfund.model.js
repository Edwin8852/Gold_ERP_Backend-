/**
 * Chit Fund Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const ChitFund = sequelize.define('ChitFund', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schemeName: {
      type: DataTypes.STRING, // e.g., "Gold Saver 2026"
      allowNull: false,
    },
    monthlyContribution: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    durationMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currentInstallment: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Completed', 'Closed'),
      defaultValue: 'Active',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
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
    tableName: 'chit_funds',
  });

  return ChitFund;
};
