const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ChitMember = sequelize.define('ChitMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  chitFundId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  missedMonths: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  memberStatus: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'BLOCKED'),
    defaultValue: 'ACTIVE',
  },
  inactiveReason: {
    type: DataTypes.TEXT,
  },
  lastPaidMonth: {
    type: DataTypes.DATEONLY,
  },
  reactivatedAt: {
    type: DataTypes.DATE,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'chit_members'
});

module.exports = ChitMember;
