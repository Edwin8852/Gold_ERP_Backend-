module.exports = (sequelize, DataTypes) => {
  const ChitFund = sequelize.define('ChitFund', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schemeName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    monthlyContribution: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    durationMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'ACTIVE',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    }
  }, {
    timestamps: true,
    tableName: 'chit_funds'
  });

  ChitFund.associate = (models) => {
    ChitFund.hasMany(models.ChitMember, { foreignKey: 'chitFundId', as: 'members' });
  };

  return ChitFund;
};
