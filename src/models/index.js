const { sequelize } = require('../config/db.config');
const { Sequelize, DataTypes } = require('sequelize');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import Models (We will add more as we create modules)
db.Customer = require('./customer.model.js')(sequelize, DataTypes);
db.Order = require('./order.model.js')(sequelize, DataTypes);
db.ChitFund = require('./chitfund.model.js')(sequelize, DataTypes);
db.GoldRate = require('./goldrate.model.js')(sequelize, DataTypes);

// Define Associations
db.Customer.hasMany(db.Order, { foreignKey: 'customerId', as: 'orders' });
db.Order.belongsTo(db.Customer, { foreignKey: 'customerId', as: 'customer' });

db.Customer.hasMany(db.ChitFund, { foreignKey: 'customerId', as: 'chitFunds' });
db.ChitFund.belongsTo(db.Customer, { foreignKey: 'customerId', as: 'customer' });

module.exports = db;
