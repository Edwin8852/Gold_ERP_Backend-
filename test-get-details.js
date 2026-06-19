require('dotenv').config();
const { GoldLoan } = require('./src/models');
const goldLoanService = require('./src/modules/goldLoan/goldLoan.service');

// Disable sequelize logging
GoldLoan.sequelize.options.logging = false;

async function test() {
  try {
    const loan = await GoldLoan.findOne();
    if (!loan) {
      console.log('No loan found');
      return;
    }
    console.log('Testing loan:', loan.id);
    const details = await goldLoanService.getLoanDetails(loan.id, null);
    console.log('Details fetched successfully');
  } catch (error) {
    console.error('ERROR OCCURRED:');
    console.error(error.name);
    console.error(error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

test();
