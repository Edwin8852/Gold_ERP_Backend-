const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Sequelize connection configuration
 * Enterprise approach: uses connection pooling for performance
 */
const isProduction = process.env.NODE_ENV === 'production';

const sequelizeOptions = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: isProduction ? false : (msg) => console.log(`[Sequelize] ${msg}`),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  ...(isProduction && {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  })
};

let sequelize;
// Ignore cloud connection strings (DATABASE_URL) for local development
if (process.env.DATABASE_URL && isProduction) {
  sequelize = new Sequelize(process.env.DATABASE_URL, sequelizeOptions);
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    sequelizeOptions
  );
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected Successfully.');
    console.log(`🔌 Connected Database Name : ${sequelize.config.database}`);
    console.log(`🌍 Connected Host          : ${sequelize.config.host}`);
    console.log(`⚙️  Environment             : ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    
    // Enterprise-level error handling with helpful hints
    if (error.name === 'SequelizeConnectionRefusedError') {
      console.error('💡 Hint: Check if PostgreSQL service is running locally on port 5432.');
    } else if (error.name === 'SequelizeAccessDeniedError') {
      console.error('💡 Hint: Check your DB_USER and DB_PASSWORD credentials.');
    } else if (error.name === 'SequelizeDatabaseError' && error.message.includes('does not exist')) {
      console.error(`💡 Hint: The database "${process.env.DB_NAME}" does not exist. Please create it using pgAdmin or psql.`);
    }
    
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
