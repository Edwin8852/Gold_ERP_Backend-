'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add pdfPath to invoices table
    await queryInterface.addColumn('invoices', 'pdfPath', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('invoices', 'pdfPath');
  }
};
