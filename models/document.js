const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Document extends Model {
    static associate(models) {
      // Relations avec d'autres modèles
      Document.belongsTo(models.Candidature, { foreignKey: 'candidature_id', as: 'candidature' });
    }
  }

  Document.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    candidature_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'candidatures',
        key: 'id'
      }
    },
    document_type: {
      type: DataTypes.ENUM('business_plan', 'cv', 'presentation', 'autre'),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Type de document requis' }
      }
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nom du fichier requis' }
      }
    },
    file_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Chemin du fichier requis' }
      }
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Type MIME requis' }
      }
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'La taille du fichier doit être positive' }
      }
    },
    upload_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Document',
    tableName: 'documents',
    timestamps: false
  });

  return Document;
}; 