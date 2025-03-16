const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectTeam extends Model {
    static associate(models) {
      // Relations avec d'autres modèles
      ProjectTeam.belongsTo(models.Candidature, { foreignKey: 'candidature_id', as: 'candidature' });
    }
  }

  ProjectTeam.init({
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
    member_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nom du membre requis' }
      }
    },
    member_role: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Rôle du membre requis' }
      }
    },
    member_expertise: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'ProjectTeam',
    tableName: 'project_teams',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ProjectTeam;
}; 