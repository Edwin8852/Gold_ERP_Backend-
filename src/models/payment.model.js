const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  loanId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  beforeBalance: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  afterBalance: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paymentAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    defaultValue: 'CASH',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'SUCCESS',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'payments'
});

module.exports = Payment;
