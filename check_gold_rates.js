'use strict';
const { sequelize } = require('./src/config/db.config');

async function checkGoldRates() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB Connected\n');

    const [rows] = await sequelize.query(
      `SELECT gold18k, gold22k, gold24k, "silverRate", "fetchedAt", "updatedAt", "rateDate"
       FROM gold_rates ORDER BY "updatedAt" DESC LIMIT 3;`
    );

    console.log('=== gold_rates (latest 3) ===');
    rows.forEach((r, i) => {
      console.log(`[${i}] rateDate: ${r.rateDate}`);
      console.log(`     24K: ${r.gold24k}  22K: ${r.gold22k}  18K: ${r.gold18k}  Ag: ${r.silverRate}`);
      console.log(`     fetchedAt: ${r.fetchedAt}  updatedAt: ${r.updatedAt}`);
    });

    // Calculate what 18K should be
    if (rows[0]) {
      const expected18k = parseFloat(((Number(rows[0].gold24k) * 18) / 24).toFixed(2));
      const actual18k   = Number(rows[0].gold18k);
      console.log(`\n=== 18K CHECK ===`);
      console.log(`  Expected (24K × 18/24): ${expected18k}`);
      console.log(`  Actual in DB          : ${actual18k}`);
      console.log(`  Match: ${expected18k === actual18k ? '✅ CORRECT' : '❌ MISMATCH — needs update'}`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

checkGoldRates();
