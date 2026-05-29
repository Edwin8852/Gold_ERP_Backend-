const { sequelize } = require('./src/config/db.config');
const goldFinanceService = require('./src/modules/goldFinance/goldFinance.service');
const loanPaymentService = require('./src/modules/loanPayments/loanPayment.service');

async function run() {
  try {
    await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "validated_gold_weight" FLOAT;');
    console.log('ADDED validated_gold_weight');
  } catch(e) {
    console.error('Migration ERROR:', e);
  }

  try {
    await loanPaymentService.getLoanPayments({});
    console.log('loanPaymentService.getLoanPayments() SUCCESS');
  } catch(e) {
    console.error('getLoanPayments ERROR:', e);
  }
  process.exit(0);
}
run();
