'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('system_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      settingKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      settingValue: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Insert default emailLanguagePreference
    const { v4: uuidv4 } = require('uuid');
    await queryInterface.bulkInsert('system_settings', [{
      id: uuidv4(),
      settingKey: 'emailLanguagePreference',
      settingValue: 'English + Tamil',
      description: 'Default language preference for emails and PDFs',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_settings');
  }
};
