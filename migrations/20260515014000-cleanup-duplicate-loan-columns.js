'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('gold_loans');

    const columnsToRemove = [
      'remainingPrincipal',
      'principalAmount',
      'loanAmount',
      'totalPaid',
      'interestRate',
      'monthlyInterest',
      'totalRepayment',
      'goldValue',
      'eligibleLoanAmount',
      'loanToValueRatio',
      'loanDate',
      'dueDate',
      'createdBy',
      'riskScore',
      'riskCategory',
      'valuationDetails'
    ];

    for (const columnName of columnsToRemove) {
      if (tableInfo[columnName]) {
        console.log(`Dropping redundant column: ${columnName}`);
        await queryInterface.removeColumn('gold_loans', columnName);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Usually no need to bring back redundant columns
  }
};
