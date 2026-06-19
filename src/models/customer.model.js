/**
 * Customer Model Definition
 */
module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'customerCode'
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'firstName'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'lastName'
    },
    mobileNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'mobileNumber',
      validate: {
        is: /^[0-9]{10}$/,
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },
    address: {
      type: DataTypes.TEXT,
    },
    city: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    pincode: {
      type: DataTypes.STRING,
    },
    aadharNumber: {
      type: DataTypes.STRING,
      unique: true,
      field: 'aadharNumber',
      validate: {
        is: /^[0-9]{12}$/,
      }
    },
    panNumber: {
      type: DataTypes.STRING,
      unique: true,
      field: 'panNumber',
      validate: {
        is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      }
    },
    photo: {
      type: DataTypes.STRING,
    },
    kycStatus: {
      type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
      defaultValue: 'PENDING',
      field: 'kycStatus'
    },
    isKycVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'isKycVerified'
    },
    kycDocuments: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'kycDocuments',
      comment: 'Paths to Aadhaar, PAN, and other docs'
    },
    addressProof: {
      type: DataTypes.STRING,
      field: 'addressProof'
    },
    signature: {
      type: DataTypes.STRING,
    },
    customerType: {
      type: DataTypes.ENUM('REGISTERED', 'WALK_IN'),
      defaultValue: 'REGISTERED',
      field: 'customerType'
    },
    alternativeNumber: {
      type: DataTypes.STRING,
      field: 'alternativeNumber'
    },
    gender: {
      type: DataTypes.STRING,
      field: 'gender'
    },
    occupation: {
      type: DataTypes.STRING,
      field: 'occupation'
    },
    remarks: {
      type: DataTypes.TEXT,
      field: 'remarks'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'createdBy'
    },
    riskScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'riskScore'
    },
    lastRiskUpdate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'lastRiskUpdate'
    },
    preferredLanguage: {
      type: DataTypes.ENUM('en', 'ta'),
      defaultValue: 'en',
      field: 'preferredLanguage'
    },

  }, {
    timestamps: true,
    tableName: 'customers',
  });

  Customer.associate = (models) => {
    Customer.hasMany(models.GoldLoan, { foreignKey: 'customerId', as: 'loans' });
    Customer.hasMany(models.Ticket, { foreignKey: 'customerId', as: 'tickets' });
    Customer.hasMany(models.Ticket, { foreignKey: 'customerId', as: 'SupportTicket' });
    Customer.hasMany(models.LoanPayment, { foreignKey: 'customerId', as: 'loanPayments' });
  };

  return Customer;
};
