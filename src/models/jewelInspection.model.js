const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const JewelInspection = sequelize.define('JewelInspection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  loanId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  jewelType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  grossWeight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  netWeight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  purity: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  damageDescription: {
    type: DataTypes.TEXT,
  },
  damagePhoto: {
    type: DataTypes.STRING,
  },
  remarks: {
    type: DataTypes.TEXT,
  },
  customerConfirmation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  inspectionStatus: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'jewel_inspections'
});

module.exports = JewelInspection;
