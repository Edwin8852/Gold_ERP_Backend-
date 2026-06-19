const { sequelize } = require('./src/config/db.config');
const db = require('./src/models');

const run = async () => {
    try {
        console.log("Dropping and re-syncing Order table...");
        await db.Order.sync({ force: true });
        console.log("Order table synced successfully!");
        process.exit(0);
    } catch (e) {
        console.error(e.stack);
        process.exit(1);
    }
};
run();
