const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ChitFund = sequelize.define('ChitFund', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  schemeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  monthlyContribution: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  durationMonths: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'ACTIVE',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'chit_funds'
});

module.exports = ChitFund;
