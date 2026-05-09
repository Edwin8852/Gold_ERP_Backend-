const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  loanId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  paymentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  invoiceType: {
    type: DataTypes.ENUM('LOAN_CREATED', 'PAYMENT_RECEIVED', 'LOAN_CLOSED'),
    allowNull: false,
  },
  oldBalance: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paidAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  remainingBalance: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  interestAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  pendingAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  totalPaid: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  generatedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'invoices'
});

module.exports = Invoice;
