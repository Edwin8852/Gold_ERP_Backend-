const { sequelize } = require('./src/config/db.config');
const bcrypt = require('bcryptjs');

async function checkAndPassword() {
  try {
    await sequelize.authenticate();
    const [users] = await sequelize.query('SELECT "id", "email", "password", "role" FROM "users" WHERE "email" = \'superadmin@gmail.com\';');
    
    if (users.length === 0) {
      console.log('No superadmin user found in database!');
      return;
    }

    const user = users[0];
    console.log('Superadmin user details:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Hashed Password:', user.password);

    const testPassword = 'super@321';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log(`Does '${testPassword}' match the hashed password?`, isMatch);

    if (!isMatch) {
      console.log('Updating password to super@321...');
      const newHash = await bcrypt.hash(testPassword, 10);
      await sequelize.query(`UPDATE "users" SET "password" = '${newHash}' WHERE "id" = '${user.id}';`);
      console.log('Password updated successfully!');
      
      const isMatchNow = await bcrypt.compare(testPassword, newHash);
      console.log('New match validation:', isMatchNow);
    }
  } catch (err) {
    console.error('Error checking password:', err.message);
  } finally {
    await sequelize.close();
  }
}

checkAndPassword();
