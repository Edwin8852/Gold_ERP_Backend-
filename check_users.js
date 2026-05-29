const { sequelize } = require('./src/config/db.config');

async function checkUsers() {
  try {
    await sequelize.authenticate();
    const [users] = await sequelize.query('SELECT "id", "firstName", "lastName", "email", "role" FROM "users";');
    console.log('--- USERS IN DATABASE ---');
    console.log(users);
    console.log('-------------------------');
  } catch (err) {
    console.error('Error checking users:', err.message);
  } finally {
    await sequelize.close();
  }
}

checkUsers();
