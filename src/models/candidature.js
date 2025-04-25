const { DataTypes } = require('sequelize');

/**
 * Modèle Sequelize pour les candidatures
 * @param {Object} sequelize - Instance Sequelize
 * @returns {Object} Modèle Candidature
 */
module.exports = (sequelize) => {
  const Candidature = sequelize.define('Candidature', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    promotion: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '2025'
    },
    status: {
      type: DataTypes.ENUM('brouillon', 'soumise', 'en_cours_evaluation', 'validee', 'rejetee'),
      allowNull: false,
      defaultValue: 'brouillon'
    },
    // Colonnes JSON pour les données structurées
    fiche_identite: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    projet_utilite_sociale: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    qui_est_concerne: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    modele_economique: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    parties_prenantes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    equipe_projet: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    documents_json: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    structure_juridique: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    etat_avancement: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    completion_percentage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    submission_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    monday_item_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    generated_pdf_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'candidatures',
    timestamps: true,
    underscored: true
  });

  /**
   * Associations du modèle
   * @param {Object} models - Modèles de la base de données
   */
  Candidature.associate = function(models) {
    Candidature.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    Candidature.hasMany(models.ProjectTeam, {
      foreignKey: 'candidature_id',
      as: 'teamMembers'
    });
    
    Candidature.hasMany(models.Document, {
      foreignKey: 'candidature_id',
      as: 'documents'
    });
    
    Candidature.hasMany(models.Evaluation, {
      foreignKey: 'candidature_id',
      as: 'evaluations'
    });
    
    Candidature.hasMany(models.CandidatureAccess, {
      foreignKey: 'candidature_id',
      as: 'accesses'
    });
  };

  return Candidature;
}; 