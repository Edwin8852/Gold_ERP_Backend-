'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('gold_loans');

    const columnsToAdd = {
      approved_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: true
      },
      remaining_principal: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false
      },
      interest_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: true
      },
      total_repayment: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: true
      },
      penalty_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: true
      },
      eligible_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: true
      },
      gold_value: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: true
      },
      risk_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true
      },
      risk_category: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        defaultValue: 'LOW',
        allowNull: true
      },
      // Additional financial columns that might be missing or need conversion
      total_paid: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: true
      },
      interest_rate: {
        type: Sequelize.FLOAT,
        defaultValue: 12,
        allowNull: true
      },
      monthly_interest: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: true
      },
      loan_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false
      },
      principal_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false
      }
    };

    for (const [columnName, definition] of Object.entries(columnsToAdd)) {
      if (!tableInfo[columnName]) {
        await queryInterface.addColumn('gold_loans', columnName, definition);
      } else {
        // If it exists, change the type to DECIMAL if it was FLOAT
        if (definition.type.key === 'DECIMAL' && tableInfo[columnName].type.includes('DOUBLE')) {
          await queryInterface.changeColumn('gold_loans', columnName, definition);
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // We usually don't want to drop financial columns in a down migration if they contain data
    // But for a clean rollback if needed:
    /*
    await queryInterface.removeColumn('gold_loans', 'approved_amount');
    await queryInterface.removeColumn('gold_loans', 'interest_amount');
    await queryInterface.removeColumn('gold_loans', 'penalty_amount');
    await queryInterface.removeColumn('gold_loans', 'eligible_amount');
    */
  }
};
