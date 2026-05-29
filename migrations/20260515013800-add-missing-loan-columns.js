'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('gold_loans');

    const columnsToAdd = {
      loan_to_value_ratio: {
        type: Sequelize.FLOAT,
        defaultValue: 0.75,
        allowNull: true
      },
      valuation_details: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      loan_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: true
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      gold_type: {
        type: Sequelize.STRING,
        defaultValue: "ORNAMENTS",
        allowNull: true
      },
      ornament_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      jewelry_details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      jewelry_images: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      repayment_terms: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true
      }
    };

    for (const [columnName, definition] of Object.entries(columnsToAdd)) {
      if (!tableInfo[columnName]) {
        await queryInterface.addColumn('gold_loans', columnName, definition);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('gold_loans');
    const columnsToRemove = [
      'loan_to_value_ratio',
      'valuation_details',
      'loan_date',
      'due_date',
      'gold_type',
      'ornament_type',
      'jewelry_details',
      'jewelry_images',
      'repayment_terms',
      'created_by',
      'approved_by'
    ];

    for (const columnName of columnsToRemove) {
      if (tableInfo[columnName]) {
        await queryInterface.removeColumn('gold_loans', columnName);
      }
    }
  }
};
