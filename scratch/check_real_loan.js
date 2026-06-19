const db = require('../src/models');
db.sequelize.query("SELECT * FROM gold_loans WHERE status = 'ACTIVE' LIMIT 5").then(([results]) => {
  results.forEach(r => {
    console.log(`Loan ${r.loanNumber}: approved=${r.approved_amount}, loan=${r.loan_amount}, principal=${r.principal_amount}, total_paid=${r.total_paid}`);
  });
  process.exit(0);
});
