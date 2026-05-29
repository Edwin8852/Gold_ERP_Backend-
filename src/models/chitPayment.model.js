module.exports = (sequelize, DataTypes) => {
  const ChitPayment = sequelize.define('ChitPayment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chitMemberId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    paymentAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    paymentMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paymentYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    paymentStatus: {
      type: DataTypes.ENUM('PAID', 'PENDING', 'MISSED'),
      defaultValue: 'PAID',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    }
  }, {
    timestamps: true,
    tableName: 'chit_payments'
  });

  ChitPayment.associate = (models) => {
    ChitPayment.belongsTo(models.ChitMember, { foreignKey: 'chitMemberId', as: 'member' });
  };

  return ChitPayment;
};
