'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Map existing deprecated statuses to new statuses
    await queryInterface.sequelize.query(`
      UPDATE gold_loans SET status = 'ACTIVE' WHERE status IN ('PARTIALLY_PAID');
      UPDATE gold_loans SET status = 'READY_FOR_CLOSURE' WHERE status IN ('FULLY_PAID');
      UPDATE gold_loans SET status = 'CLOSED' WHERE status IN ('LOAN_CLOSED');
    `);

    // 2. Create the loan_ledger_entries table
    await queryInterface.createTable('loan_ledger_entries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      loan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'gold_loans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      transaction_type: {
        type: Sequelize.ENUM('LOAN_CREATION', 'INTEREST_PAYMENT', 'PRINCIPAL_PAYMENT', 'PENALTY', 'CLOSURE', 'ORNAMENT_RELEASE'),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      balance_after: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('loan_ledger_entries');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_loan_ledger_entries_transaction_type" CASCADE;');
  }
};
