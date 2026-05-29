const { sequelize } = require('./src/config/db.config');

async function checkLogins() {
  try {
    await sequelize.authenticate();
    const [loginLogs] = await sequelize.query('SELECT * FROM "login_logs" ORDER BY "createdAt" DESC LIMIT 5;');
    console.log('--- RECENT LOGIN LOGS ---');
    console.log(loginLogs);
    console.log('-------------------------');
  } catch (err) {
    console.error('Error checking logins:', err.message);
  } finally {
    await sequelize.close();
  }
}

checkLogins();
