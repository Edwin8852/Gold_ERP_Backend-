const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GoldLoan = sequelize.define('GoldLoan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  goldWeight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  goldPurity: {
    type: DataTypes.STRING,
  },
  loanAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  principalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  remainingPrincipal: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  totalPaid: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  interestRate: {
    type: DataTypes.FLOAT,
    defaultValue: 12,
  },
  monthlyInterest: {
    type: DataTypes.FLOAT,
  },
  totalRepayment: {
    type: DataTypes.FLOAT,
  },
  goldValue: {
    type: DataTypes.FLOAT,
  },
  eligibleLoanAmount: {
    type: DataTypes.FLOAT,
  },
  loanToValueRatio: {
    type: DataTypes.FLOAT,
    defaultValue: 0.75,
  },
  loanDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  dueDate: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'PENDING', 'CLOSED', 'OVERDUE'),
    defaultValue: 'ACTIVE',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'gold_loans'
});

// Associations
const Customer = require('./customer.model');
const JewelInspection = require('./jewelInspection.model');

Customer.hasMany(GoldLoan, { foreignKey: 'customerId', as: 'loans' });
GoldLoan.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

GoldLoan.hasMany(JewelInspection, { foreignKey: 'loanId', as: 'inspections' });
JewelInspection.belongsTo(GoldLoan, { foreignKey: 'loanId', as: 'loan' });

module.exports = GoldLoan;
