const { sequelize, connectDB } = require('./src/config/db.config');

const run = async () => {
  try {
    await connectDB();
    await sequelize.query('ALTER TABLE gold_rates ADD COLUMN IF NOT EXISTS gold22k DECIMAL(12, 2);');
    await sequelize.query('ALTER TABLE gold_rates ADD COLUMN IF NOT EXISTS gold24k DECIMAL(12, 2);');
    await sequelize.query('ALTER TABLE gold_rates ADD COLUMN IF NOT EXISTS "silverRate" DECIMAL(12, 2);');
    await sequelize.query('ALTER TABLE gold_rates ADD COLUMN IF NOT EXISTS "rateDate" DATE;');
    await sequelize.query('ALTER TABLE gold_rates ADD COLUMN IF NOT EXISTS source VARCHAR(255);');
    await sequelize.query('ALTER TABLE gold_rates ADD COLUMN IF NOT EXISTS "fetchedAt" TIMESTAMP WITH TIME ZONE;');
    console.log('Successfully added missing columns to gold_rates');
  } catch (err) {
    console.error('Failed to add columns', err);
  } finally {
    process.exit(0);
  }
};

run();
