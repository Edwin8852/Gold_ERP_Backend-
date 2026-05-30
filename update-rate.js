require('dotenv').config();
const { GoldRate } = require('./src/models');
const { fetchAndSaveTodaysRate } = require('./src/modules/goldRates/goldRate.service');

async function update() {
  try {
    console.log("Forcing rate update...");
    const rate = await fetchAndSaveTodaysRate(true);
    console.log("New Rate Saved:", rate.toJSON());
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err.message);
    
    // Fallback: manually update DB
    try {
      console.log("Trying manual DB update...");
      await GoldRate.update({ gold18k: 12275 }, { where: {} });
      console.log("Manually updated all records to 12275");
    } catch(e) {
      console.error(e);
    }
    process.exit(1);
  }
}
update();
