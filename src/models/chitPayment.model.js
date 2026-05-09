const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

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

module.exports = ChitPayment;
