const db = require('../src/models');
db.sequelize.query("SELECT * FROM gold_loans LIMIT 1").then(([results]) => {
  console.log(results[0]);
  process.exit(0);
});
