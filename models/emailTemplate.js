const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmailTemplate = sequelize.define('EmailTemplate', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Nom unique du template (ex: submission_confirmation, application_status_accepted)'
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Sujet du template d\'email'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Corps du template d\'email, peut contenir des placeholders comme {{userName}}'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description pour l\'admin sur l\'utilisation de ce template'
    }
  }, {
    tableName: 'email_templates',
    timestamps: true, // Ajoute createdAt et updatedAt
    underscored: true, // Utilise snake_case pour les colonnes générées automatiquement
    comment: 'Table pour stocker les templates d\'emails configurables'
  });

  return EmailTemplate;
}; 