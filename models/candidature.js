const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Candidature extends Model {
    static associate(models) {
      // Relations avec d'autres modèles
      Candidature.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Candidature.hasMany(models.ProjectTeam, { foreignKey: 'candidature_id', as: 'teamMembers' });
      Candidature.hasMany(models.Document, { foreignKey: 'candidature_id', as: 'documents' });
      Candidature.hasMany(models.Evaluation, { foreignKey: 'candidature_id', as: 'evaluations' });
      Candidature.belongsToMany(models.User, { 
        through: models.CandidatureAccess,
        foreignKey: 'candidature_id',
        as: 'accessUsers'
      });
    }

    // Méthode pour calculer le pourcentage de complétion de la candidature
    getCompletionPercentage() {
      if (!this.completed_sections) return 0;
      
      // Convertir le JSON en objet si nécessaire
      const sections = typeof this.completed_sections === 'string' 
        ? JSON.parse(this.completed_sections) 
        : this.completed_sections;
      
      const totalSections = Object.keys(sections).length;
      const completedSections = Object.values(sections).filter(Boolean).length;
      
      return Math.round((completedSections / totalSections) * 100);
    }

    // Méthode pour vérifier si la candidature est prête pour la soumission
    isReadyForSubmission() {
      return this.getCompletionPercentage() === 100;
    }
  }

  Candidature.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Promotion requise' }
      }
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
      validate: {
        notNull: { msg: 'Le numéro de téléphone est requis' }
      }
    },
    fiche_identite: {
      type: DataTypes.JSON,
      allowNull: true
    },
    projet_utilite_sociale: {
      type: DataTypes.JSON,
      allowNull: true
    },
    qui_est_concerne: {
      type: DataTypes.JSON,
      allowNull: true
    },
    modele_economique: {
      type: DataTypes.JSON,
      allowNull: true
    },
    parties_prenantes: {
      type: DataTypes.JSON,
      allowNull: true
    },
    equipe_projet: {
      type: DataTypes.JSON,
      allowNull: true
    },
    documents_json: {
      type: DataTypes.JSON,
      allowNull: true
    },
    completed_sections: {
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('brouillon', 'soumise', 'en_evaluation', 'acceptee', 'rejetee'),
      defaultValue: 'brouillon'
    },
    submission_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    monday_item_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    generated_pdf_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Candidature',
    tableName: 'candidatures',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Candidature;
}; 