/**
 * Chit Scheme Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const ChitScheme = sequelize.define('ChitScheme', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    schemeName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'schemeName'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: 'totalAmount'
    },
    monthlyInstallment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: 'monthlyInstallment'
    },
    durationMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'durationMonths'
    },
    maxSubscribers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'maxSubscribers'
    },
    currentSubscribers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'currentSubscribers'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'startDate'
    },
    status: {
      type: DataTypes.ENUM('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'CLOSED', 'ARCHIVED'),
      defaultValue: 'UPCOMING',
    },
    commissionPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 5.00, // 5% standard commission
      field: 'commissionPercentage'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    launchDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'launch_date'
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expiry_date'
    }
  }, {
    tableName: 'chit_schemes',
    timestamps: true,
  });

  ChitScheme.associate = (models) => {
    ChitScheme.hasMany(models.ChitSubscriber, { foreignKey: 'schemeId', as: 'subscribers' });
  };

  return ChitScheme;
};
