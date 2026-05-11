const app = require('./app');
const { connectDB } = require('./config/db.config');
const db = require('./models');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Connect to Database
  await connectDB();

  // 2. Sync Models (Force: false prevents data loss)
  await db.sequelize.sync({ alter: true });
  console.log('✅ Database Models Synced.');

  // 3. Start Listening
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();
