const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const db = {};

// Load all models dynamically
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-9) === '.model.js');
  })
  .forEach(file => {
    const modelDef = require(path.join(__dirname, file));
    let model;
    
    // Support both function pattern and direct model exports
    if (typeof modelDef === 'function' && !modelDef.prototype?.constructor) {
      model = modelDef(sequelize, DataTypes);
    } else {
      model = modelDef;
    }
    
    if (model && model.name) {
      db[model.name] = model;
    }
  });

// Call associate if defined in models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
