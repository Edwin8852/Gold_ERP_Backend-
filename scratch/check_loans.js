const db = require('../src/models');
db.sequelize.query("SELECT id, status, loan_closed, remaining_principal FROM gold_loans").then(([results]) => {
  console.log(results);
  process.exit(0);
});
