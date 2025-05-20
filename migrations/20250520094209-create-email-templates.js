'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_templates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Nom unique du template (ex: submission_confirmation, application_status_accepted)'
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Sujet du template d\'email'
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Corps du template d\'email, peut contenir des placeholders comme {{userName}}'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description pour l\'admin sur l\'utilisation de ce template'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      comment: 'Table pour stocker les templates d\'emails configurables'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_templates');
  }
};
