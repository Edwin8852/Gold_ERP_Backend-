const { Client } = require('pg');
require('dotenv').config();

const createDatabase = async () => {
  // Connect to the default 'postgres' database first
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Default database
  });

  try {
    await client.connect();
    const dbName = process.env.DB_NAME;
    
    // Check if database exists
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      console.log(`ℹ️ Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
  } finally {
    await client.end();
  }
};

createDatabase();
