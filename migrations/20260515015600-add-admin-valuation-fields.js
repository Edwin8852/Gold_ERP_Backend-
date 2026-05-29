'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('gold_loans');

    const columnsToAdd = {
      validated_gold_weight: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      current_gold_rate: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      loan_duration: {
        type: Sequelize.INTEGER,
        defaultValue: 12,
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
    await queryInterface.removeColumn('gold_loans', 'validated_gold_weight');
    await queryInterface.removeColumn('gold_loans', 'current_gold_rate');
    await queryInterface.removeColumn('gold_loans', 'loan_duration');
  }
};
