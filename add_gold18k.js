const { sequelize, connectDB } = require('./src/config/db.config');

const run = async () => {
  try {
    await connectDB();
    await sequelize.query('ALTER TABLE gold_rates ADD COLUMN IF NOT EXISTS gold18k DECIMAL(12, 2);');
    console.log('Successfully added gold18k column to gold_rates');
  } catch (err) {
    console.error('Failed to add column', err);
  } finally {
    process.exit(0);
  }
};

run();
