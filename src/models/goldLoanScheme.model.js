module.exports = (sequelize, DataTypes) => {
  const GoldLoanScheme = sequelize.define('GoldLoanScheme', {
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
    interestRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'interestRate'
    },
    ltvPercentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 75,
      field: 'ltvPercentage'
    },
    durationMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12,
      field: 'durationMonths'
    },
    penaltyRate: {
      type: DataTypes.FLOAT,
      defaultValue: 2,
      field: 'penaltyRate'
    },
    processingFee: {
      type: DataTypes.FLOAT,
      defaultValue: 500,
      field: 'processingFee'
    },
    minimumAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 1000,
      field: 'minimumAmount'
    },
    maximumAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'maximumAmount'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'createdBy'
    }
  }, {
    timestamps: true,
    tableName: 'gold_loan_schemes'
  });

  GoldLoanScheme.associate = (models) => {
    GoldLoanScheme.hasMany(models.GoldLoan, { foreignKey: 'schemeId', as: 'loans' });
  };

  return GoldLoanScheme;
};
