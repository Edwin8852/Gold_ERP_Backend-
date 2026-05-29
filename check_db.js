const { sequelize } = require('./src/config/db.config');

async function checkData() {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query('SELECT "id", "loanNumber" FROM "gold_loans" LIMIT 10;');
    console.log('Current gold_loans data:', results);
    
    const [nullCount] = await sequelize.query('SELECT count(*) FROM "gold_loans" WHERE "loanNumber" IS NULL;');
    console.log('Null loanNumbers:', nullCount[0].count);
    
    const [duplicates] = await sequelize.query('SELECT "loanNumber", COUNT(*) FROM "gold_loans" GROUP BY "loanNumber" HAVING COUNT(*) > 1;');
    console.log('Duplicate loanNumbers:', duplicates);
    
  } catch (err) {
    console.error('Error checking data:', err.message);
  } finally {
    await sequelize.close();
  }
}

checkData();
