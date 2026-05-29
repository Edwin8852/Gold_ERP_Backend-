const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const TermsCondition = sequelize.define('TermsCondition', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.STRING, // e.g. CHIT_RULES
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'terms_conditions'
});

module.exports = TermsCondition;
