/**
 * Document Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('AADHAR', 'PAN', 'LOAN_AGREEMENT', 'CHIT_AGREEMENT', 'RECEIPT', 'OTHER'),
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    }
  }, {
    tableName: 'documents',
    timestamps: true,
  });

  Document.associate = (models) => {
    Document.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Document.belongsTo(models.User, { foreignKey: 'verifiedBy', as: 'verifier' });
  };

  return Document;
};
