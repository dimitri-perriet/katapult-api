const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Relations du modèle avec d'autres modèles
      User.hasMany(models.Candidature, { foreignKey: 'user_id', as: 'candidatures' });
      User.hasMany(models.Evaluation, { foreignKey: 'evaluator_id', as: 'evaluations' });
      User.belongsToMany(models.Candidature, { 
        through: models.CandidatureAccess,
        foreignKey: 'user_id',
        as: 'accessibleCandidatures'
      });
    }

    // Vérifier si le mot de passe est valide
    async isValidPassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    // Générer un token JWT
    generateAuthToken() {
      const jwt = require('jsonwebtoken');
      return jwt.sign(
        { id: this.id, email: this.email, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
    }

    // Ne pas retourner le mot de passe dans les réponses JSON
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Prénom requis' }
      }
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nom requis' }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Veuillez fournir une adresse email valide' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: { args: [8, 255], msg: 'Le mot de passe doit contenir au moins 8 caractères' }
      }
    },
    role: {
      type: DataTypes.ENUM('candidat', 'evaluateur', 'admin'),
      defaultValue: 'candidat'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    profile_picture: {
      type: DataTypes.STRING(255)
    },
    last_login: {
      type: DataTypes.DATE
    },
    password_changed_at: {
      type: DataTypes.DATE
    },
    password_reset_token: {
      type: DataTypes.STRING(255)
    },
    password_reset_expires: {
      type: DataTypes.DATE
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    street: {
      type: DataTypes.STRING(255)
    },
    city: {
      type: DataTypes.STRING(100)
    },
    postal_code: {
      type: DataTypes.STRING(20)
    },
    country: {
      type: DataTypes.STRING(100),
      defaultValue: 'France'
    },
    notification_email: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notification_app: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          user.password_changed_at = new Date();
        }
      }
    }
  });

  return User;
}; 