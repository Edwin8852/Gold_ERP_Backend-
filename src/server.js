const app = require('./app');
const { connectDB, sequelize } = require('./config/db.config');
const db = require('./models');
const { initCronJobs } = require('./cron'); // src/cron.js — exports { initCronJobs }

const PORT = process.env.PORT || 5000;

// Global Crash Protection
process.on('uncaughtException', (err) => {
  console.error('🔴 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('🔴 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const startServer = async () => {
  try {
    console.log('--------------------------------------------------');
    console.log('🚀 INITIALIZING SDRS GOLD FINANCE ERP BACKEND');
    console.log('--------------------------------------------------');

    // 1. Connect to Database
    await connectDB();

    // 2. Sync Models and Validate Schema
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    
    // Always run safe migrations
    try {
      console.log('🔄 Verifying GoldRate new columns...');
      await sequelize.query('ALTER TABLE gold_rates ADD COLUMN IF NOT EXISTS "city" VARCHAR(255) DEFAULT \'Chennai\';').catch(() => {});
      await sequelize.query('ALTER TABLE gold_market_rates ADD COLUMN IF NOT EXISTS "city" VARCHAR(255) DEFAULT \'Chennai\';').catch(() => {});
      console.log('✅ GoldRate columns verified.');
    } catch (e) {
      console.error('❌ Failed to add GoldRate columns:', e.message);
    }

    if (isDev) {
      try {
        if (process.env.DB_SYNC_ALTER === 'true') {
          console.log('🔄 [DEV] Syncing Database Models (alter: true)...');
          await db.sequelize.sync({ alter: true });
        } else {
          console.log('🔄 [DEV] Syncing Database Models...');
          await db.sequelize.sync();
        }
        console.log('✅ Database Models Synced.');
      } catch (syncError) {
        console.error('❌ Database Sync Error:', syncError.message);
        console.error('💡 Tip: Check for existing data that violates UNIQUE or NOT NULL constraints.');
      }

      try {
        console.log('🔄 [DEV] Verifying new User profile columns...');
        await sequelize.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "profileImage" TEXT;');
        try { await sequelize.query('ALTER TABLE users ALTER COLUMN "profileImage" TYPE TEXT;'); } catch(e) { console.error('Failed to alter profileImage type:', e.message); }
        await sequelize.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordUpdatedAt" TIMESTAMP WITH TIME ZONE;');
        console.log('✅ User profile columns verified.');
      } catch (e) {
        console.error('❌ Failed to add User profile columns:', e.message);
      }



      try {
        console.log('🔄 [DEV] Verifying Chit Scheme status ENUM values...');
        await sequelize.query(`ALTER TYPE "enum_chit_schemes_status" ADD VALUE IF NOT EXISTS 'CLOSED';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_chit_schemes_status" ADD VALUE IF NOT EXISTS 'ARCHIVED';`).catch(() => {});
      } catch (e) {
        // Ignore if not postgres or type doesn't exist yet
      }

      try {
        console.log('🔄 [DEV] Verifying Jewelry Orders status ENUM values...');
        await sequelize.query(`ALTER TYPE "enum_jewelry_orders_status" ADD VALUE IF NOT EXISTS 'DRAFT';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_jewelry_orders_status" ADD VALUE IF NOT EXISTS 'PENDING_ADVANCE';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_jewelry_orders_status" ADD VALUE IF NOT EXISTS 'ADVANCE_PAID';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_jewelry_orders_status" ADD VALUE IF NOT EXISTS 'IN_PRODUCTION';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_jewelry_orders_status" ADD VALUE IF NOT EXISTS 'READY_FOR_DELIVERY';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_jewelry_orders_status" ADD VALUE IF NOT EXISTS 'DELIVERED';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_jewelry_orders_status" ADD VALUE IF NOT EXISTS 'CANCELLED';`).catch(() => {});
      } catch (e) {
        // Ignore if not postgres or type doesn't exist yet
      }

      try {
        console.log('🔄 [DEV] Verifying Inventory Transaction ENUM values...');
        await sequelize.query(`ALTER TYPE "enum_inventory_transactions_transaction_type" ADD VALUE IF NOT EXISTS 'STOCK_IN';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_inventory_transactions_transaction_type" ADD VALUE IF NOT EXISTS 'STOCK_OUT';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_inventory_transactions_transaction_type" ADD VALUE IF NOT EXISTS 'ADJUSTMENT';`).catch(() => {});
      } catch (e) {
        // Ignore if not postgres or type doesn't exist yet
      }

      try {
        console.log('🔄 [DEV] Verifying Jewelry Orders payment ENUMs & columns...');
        await sequelize.query(`CREATE TYPE "enum_jewelry_orders_paymentMethod" AS ENUM ('ONLINE', 'CASH', 'CARD', 'BANK_TRANSFER');`).catch(() => {});
        await sequelize.query(`CREATE TYPE "enum_jewelry_orders_paymentStatus" AS ENUM ('PENDING', 'PENDING_CASH_COLLECTION', 'ADVANCE_PAID', 'PAID');`).catch(() => {});
        
        await sequelize.query('ALTER TABLE jewelry_orders ADD COLUMN IF NOT EXISTS "paymentMethod" "enum_jewelry_orders_paymentMethod" DEFAULT \'CASH\';').catch(() => {});
        await sequelize.query('ALTER TABLE jewelry_orders ADD COLUMN IF NOT EXISTS "paymentStatus" "enum_jewelry_orders_paymentStatus" DEFAULT \'PENDING\';').catch(() => {});
        
        await sequelize.query('ALTER TABLE jewelry_orders ADD COLUMN IF NOT EXISTS "createdBy" UUID REFERENCES users(id);').catch(() => {});
        await sequelize.query('ALTER TABLE jewelry_orders ADD COLUMN IF NOT EXISTS "statusChangedBy" UUID REFERENCES users(id);').catch(() => {});
        await sequelize.query('ALTER TABLE jewelry_orders ADD COLUMN IF NOT EXISTS "paymentConfirmedBy" UUID REFERENCES users(id);').catch(() => {});
        await sequelize.query('ALTER TABLE jewelry_orders ADD COLUMN IF NOT EXISTS "statusUpdatedAt" TIMESTAMP WITH TIME ZONE;').catch(() => {});
        await sequelize.query('ALTER TABLE jewelry_orders ADD COLUMN IF NOT EXISTS "paymentUpdatedAt" TIMESTAMP WITH TIME ZONE;').catch(() => {});
      } catch (e) {
        // Ignore if not postgres or type doesn't exist yet
      }

      try {
        console.log('🔄 [DEV] Verifying Chit Scheme new columns...');
        await sequelize.query('ALTER TABLE chit_schemes ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;');
        await sequelize.query('ALTER TABLE chit_schemes ADD COLUMN IF NOT EXISTS "launch_date" TIMESTAMP WITH TIME ZONE;');
        await sequelize.query('ALTER TABLE chit_schemes ADD COLUMN IF NOT EXISTS "expiry_date" TIMESTAMP WITH TIME ZONE;');
        console.log('✅ Chit Scheme columns verified.');
      } catch (e) {
        console.error('❌ Failed to add Chit Scheme columns:', e.message);
      }

      try {
        console.log('🔄 [DEV] Verifying Gold Loan Closure & Release Workflow columns & enums...');
        await sequelize.query(`ALTER TYPE "enum_gold_loans_status" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_gold_loans_status" ADD VALUE IF NOT EXISTS 'FULLY_PAID';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_gold_loans_status" ADD VALUE IF NOT EXISTS 'READY_FOR_CLOSURE';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_gold_loans_status" ADD VALUE IF NOT EXISTS 'LOAN_CLOSED';`).catch(() => {});
        await sequelize.query(`ALTER TYPE "enum_gold_loans_status" ADD VALUE IF NOT EXISTS 'ORNAMENT_RELEASED';`).catch(() => {});

        await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "loan_closed" BOOLEAN DEFAULT false;');
        await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "loan_closed_date" TIMESTAMP WITH TIME ZONE;');
        await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "loan_closed_by" UUID REFERENCES users(id);');
        await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "closure_remarks" TEXT;');
        
        await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "ornament_released" BOOLEAN DEFAULT false;');
        await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "ornament_release_date" TIMESTAMP WITH TIME ZONE;');
        await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "ornament_released_by" UUID REFERENCES users(id);');
        
        await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "received_by_customer" BOOLEAN DEFAULT false;');
        await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "received_date" TIMESTAMP WITH TIME ZONE;');
        await sequelize.query('ALTER TABLE gold_loans ADD COLUMN IF NOT EXISTS "release_notes" TEXT;');
        console.log('✅ Gold Loan Closure columns verified.');
      } catch (e) {
        console.error('❌ Failed to add Gold Loan Closure columns:', e.message);
      }
    }

    // 3. Schema Validation (Enterprise Safety Check)
    try {
      console.log('🔍 Validating Financial Schema...');
      const tableInfo = await sequelize.getQueryInterface().describeTable('gold_loans');
      const requiredColumns = [
        'approved_amount', 'remaining_principal', 'interest_amount', 
        'total_repayment', 'penalty_amount', 'eligible_amount', 
        'gold_value', 'risk_score', 'risk_category', 'loan_to_value_ratio'
      ];
      
      const missingColumns = requiredColumns.filter(col => !tableInfo[col]);
      
      if (missingColumns.length > 0) {
        console.error(`🔴 CRITICAL SCHEMA MISMATCH: Missing columns in gold_loans: ${missingColumns.join(', ')}`);
        if (!isDev) {
          console.error('🛑 Shutting down due to schema mismatch in production.');
          process.exit(1);
        }
      } else {
        console.log('✅ Financial Schema Validated.');
      }
    } catch (schemaError) {
      console.warn('⚠️ Schema validation skipped or failed:', schemaError.message);
    }

    // 3. Initialize Background Jobs (Cron)
    try {
      const liveRateService = require('./modules/liveRates/service/liveRate.service');
      liveRateService.startAutoRefresh();
      initCronJobs();
      console.log('📅 Background Services & Cron Jobs Initialized.');
    } catch (cronError) {
      console.error('⚠️ Cron Initialization Failed:', cronError.message);
    }

    // 4. Start Listening
    const server = app.listen(PORT, () => {
      console.log('--------------------------------------------------');
      console.log(`✅ Server Running on Port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log('--------------------------------------------------');
    });

  } catch (error) {
    console.error('❌ CRITICAL: Backend Startup Failed!');
    console.error(error.stack);
    process.exit(1);
  }
};

startServer();

