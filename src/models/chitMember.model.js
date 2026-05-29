module.exports = (sequelize, DataTypes) => {
  const ChitMember = sequelize.define('ChitMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chitFundId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    missedMonths: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    memberStatus: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'BLOCKED'),
      defaultValue: 'ACTIVE',
    },
    inactiveReason: {
      type: DataTypes.TEXT,
    },
    lastPaidMonth: {
      type: DataTypes.DATEONLY,
    },
    reactivatedAt: {
      type: DataTypes.DATE,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    }
  }, {
    timestamps: true,
    tableName: 'chit_members'
  });

  ChitMember.associate = (models) => {
    ChitMember.belongsTo(models.ChitFund, { foreignKey: 'chitFundId', as: 'chitFund' });
    ChitMember.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    ChitMember.hasMany(models.ChitPayment, { foreignKey: 'chitMemberId', as: 'payments' });
  };

  return ChitMember;
};
