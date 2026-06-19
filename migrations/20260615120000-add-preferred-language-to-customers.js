'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'preferredLanguage', {
      type: Sequelize.ENUM('en', 'ta'),
      defaultValue: 'en',
      allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('customers', 'preferredLanguage');
    // We should also drop the ENUM type if postgres, but Sequelize usually leaves it or we can ignore for now
    try {
      await queryInterface.sequelize.query('DROP TYPE "enum_customers_preferredLanguage";');
    } catch (e) {
      console.log('Enum type could not be dropped, might not exist or might be used elsewhere.');
    }
  }
};
