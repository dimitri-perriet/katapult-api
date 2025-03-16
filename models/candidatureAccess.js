const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CandidatureAccess extends Model {
    static associate(models) {
      // Ce modèle est une table de jointure entre User et Candidature
      // Les associations sont définies dans les modèles User et Candidature
    }
  }

  CandidatureAccess.init({
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
    candidature_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'candidatures',
        key: 'id'
      }
    },
    access_level: {
      type: DataTypes.ENUM('read', 'write', 'admin'),
      defaultValue: 'read',
      validate: {
        notEmpty: { msg: 'Niveau d\'accès requis' }
      }
    }
  }, {
    sequelize,
    modelName: 'CandidatureAccess',
    tableName: 'candidature_access',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'candidature_id']
      }
    ]
  });

  return CandidatureAccess;
}; 