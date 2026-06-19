'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('gold_loans');

    const columnsToAdd = {
      currentStatus: {
        type: Sequelize.STRING,
        defaultValue: 'ACTIVE',
        allowNull: true
      },
      totalPenalty: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: true
      },
      totalInterestPaid: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: true
      },
      totalPrincipalPaid: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: true
      },
      lastPaymentDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nextDueDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      loan_closed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true
      },
      loan_closed_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      loan_closed_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      closure_remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ornament_released: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true
      },
      ornament_release_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ornament_released_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      received_by_customer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true
      },
      received_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      release_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    };

    for (const [columnName, definition] of Object.entries(columnsToAdd)) {
      if (!tableInfo[columnName]) {
        await queryInterface.addColumn('gold_loans', columnName, definition);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('gold_loans');
    const columnsToRemove = [
      'currentStatus',
      'totalPenalty',
      'totalInterestPaid',
      'totalPrincipalPaid',
      'lastPaymentDate',
      'nextDueDate',
      'loan_closed',
      'loan_closed_date',
      'loan_closed_by',
      'closure_remarks',
      'ornament_released',
      'ornament_release_date',
      'ornament_released_by',
      'received_by_customer',
      'received_date',
      'release_notes'
    ];

    for (const columnName of columnsToRemove) {
      if (tableInfo[columnName]) {
        await queryInterface.removeColumn('gold_loans', columnName);
      }
    }
  }
};
