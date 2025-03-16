const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Evaluation extends Model {
    static associate(models) {
      // Relations avec d'autres modèles
      Evaluation.belongsTo(models.Candidature, { foreignKey: 'candidature_id', as: 'candidature' });
      Evaluation.belongsTo(models.User, { foreignKey: 'evaluator_id', as: 'evaluator' });
    }

    // Méthode pour calculer le score total
    getTotalScore() {
      const scores = [
        this.innovation_score, 
        this.viability_score, 
        this.impact_score, 
        this.team_score, 
        this.alignment_score
      ];
      const sum = scores.reduce((acc, score) => acc + score, 0);
      return {
        score: sum,
        maxScore: 25,
        percentage: Math.round((sum / 25) * 100)
      };
    }
  }

  Evaluation.init({
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
    evaluator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    innovation_score: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Le score minimum est 0' },
        max: { args: [5], msg: 'Le score maximum est 5' }
      }
    },
    innovation_comment: {
      type: DataTypes.TEXT
    },
    viability_score: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Le score minimum est 0' },
        max: { args: [5], msg: 'Le score maximum est 5' }
      }
    },
    viability_comment: {
      type: DataTypes.TEXT
    },
    impact_score: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Le score minimum est 0' },
        max: { args: [5], msg: 'Le score maximum est 5' }
      }
    },
    impact_comment: {
      type: DataTypes.TEXT
    },
    team_score: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Le score minimum est 0' },
        max: { args: [5], msg: 'Le score maximum est 5' }
      }
    },
    team_comment: {
      type: DataTypes.TEXT
    },
    alignment_score: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Le score minimum est 0' },
        max: { args: [5], msg: 'Le score maximum est 5' }
      }
    },
    alignment_comment: {
      type: DataTypes.TEXT
    },
    general_comment: {
      type: DataTypes.TEXT
    },
    recommendation: {
      type: DataTypes.ENUM('accepter', 'rejeter', 'à_discuter'),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Recommandation requise' }
      }
    },
    status: {
      type: DataTypes.ENUM('en_cours', 'terminée'),
      defaultValue: 'en_cours'
    }
  }, {
    sequelize,
    modelName: 'Evaluation',
    tableName: 'evaluations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Evaluation;
}; 