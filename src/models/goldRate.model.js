const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GoldRate = sequelize.define('GoldRate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  rateDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  gold22KRate: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  gold24KRate: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'gold_rates'
});

module.exports = GoldRate;
