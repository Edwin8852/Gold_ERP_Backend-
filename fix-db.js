require('dotenv').config();
const { sequelize } = require('./src/models');

async function fix() {
  try {
    console.log("Syncing database with alter: true...");
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully!");
    
    // Also run the rate fetch now that it's fixed
    const { fetchAndSaveTodaysRate } = require('./src/modules/goldRates/goldRate.service');
    const rate = await fetchAndSaveTodaysRate(true);
    console.log("Saved new rate:", rate.toJSON());
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
}
fix();
