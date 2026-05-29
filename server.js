const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize, connectDB } = require('./src/config/db.config');
const routes = require('./src/routes');
const { initCronJobs } = require('./src/cron');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const i18next = require('./src/shared/utils/i18n');
const middleware = require('i18next-http-middleware');
app.use(middleware.handle(i18next));

// API Routes
app.use('/api', routes);

// Health-check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "SDRS Gold Finance ERP API Running"
  });
});

// Sync and Start Server
const startServer = async () => {
  try {
    await connectDB();
    console.log('[Sync] Starting database synchronization...');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database Synced Successfully (alter: true)');

    // Force add columns if sync {alter: true} missed them
    try {
      console.log('[Migration] Verifying enterprise columns (snake_case)...');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "validated_gold_weight" FLOAT;');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "approved_amount" FLOAT;');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "gold_type" VARCHAR(255) DEFAULT \'ORNAMENTS\';');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "jewelry_details" TEXT;');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "jewelry_images" JSONB;');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "repayment_terms" TEXT;');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "approved_by" UUID;');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "ornament_type" VARCHAR(255);');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "risk_score" INTEGER;');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "risk_category" VARCHAR(50);');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "risk_category" VARCHAR(50);');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "currentStatus" VARCHAR(255) DEFAULT \'ACTIVE\';');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "totalPenalty" DECIMAL(15, 2) DEFAULT 0.00;');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "totalInterestPaid" DECIMAL(15, 2) DEFAULT 0.00;');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "totalPrincipalPaid" DECIMAL(15, 2) DEFAULT 0.00;');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP WITH TIME ZONE;');
      await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "nextDueDate" DATE;');
      console.log('✅ Enterprise columns verified successfully.');

      console.log('[Migration] Verifying Chit Fund advanced columns & custom types...');
      await sequelize.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ChitFundPayments_paymentStatus') THEN
            CREATE TYPE "enum_ChitFundPayments_paymentStatus" AS ENUM('PARTIAL_PAID', 'FULLY_PAID', 'INSTALLMENT_PAID', 'PENDING', 'OVERDUE');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ChitSubscribers_currentStatus') THEN
            CREATE TYPE "enum_ChitSubscribers_currentStatus" AS ENUM('PARTIAL_PAID', 'FULLY_PAID', 'INSTALLMENT_PAID', 'PENDING', 'OVERDUE');
          END IF;
        END $$;
      `);
      
      await sequelize.query('ALTER TABLE chit_fund_payments ADD COLUMN IF NOT EXISTS "installmentNumber" INTEGER;');
      await sequelize.query('ALTER TABLE chit_fund_payments ADD COLUMN IF NOT EXISTS "remainingBalance" DECIMAL(15, 2);');
      await sequelize.query('ALTER TABLE chit_fund_payments ADD COLUMN IF NOT EXISTS "paymentStatus" "enum_ChitFundPayments_paymentStatus";');
      await sequelize.query('ALTER TABLE chit_fund_payments ADD COLUMN IF NOT EXISTS "invoiceNumber" VARCHAR(255);');
      await sequelize.query('ALTER TABLE chit_fund_payments ADD COLUMN IF NOT EXISTS "invoiceUrl" VARCHAR(255);');

      await sequelize.query('ALTER TABLE chit_subscribers ADD COLUMN IF NOT EXISTS "currentStatus" "enum_ChitSubscribers_currentStatus" DEFAULT \'PENDING\';');
      await sequelize.query('ALTER TABLE chit_subscribers ADD COLUMN IF NOT EXISTS "totalPaidAmount" DECIMAL(15, 2) DEFAULT 0.00;');
      await sequelize.query('ALTER TABLE chit_subscribers ADD COLUMN IF NOT EXISTS "remainingAmount" DECIMAL(15, 2) DEFAULT 0.00;');
      await sequelize.query('ALTER TABLE chit_subscribers ADD COLUMN IF NOT EXISTS "completedInstallments" INTEGER DEFAULT 0;');
      await sequelize.query('ALTER TABLE chit_subscribers ADD COLUMN IF NOT EXISTS "pendingInstallments" INTEGER DEFAULT 0;');
      await sequelize.query('ALTER TABLE chit_subscribers ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP WITH TIME ZONE;');
      await sequelize.query('ALTER TABLE chit_subscribers ADD COLUMN IF NOT EXISTS "nextDueDate" DATE;');
      console.log('✅ Chit Fund advanced columns & custom types verified successfully.');
    } catch (e) {
      console.error('❌ Migration Warning (Ignored):', e.message);
    }
    
    // Initialize Automation Engine
    initCronJobs();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
  }
};

startServer();
