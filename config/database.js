require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'katapult_user',
    password: process.env.DB_PASSWORD || 'votre_mot_de_passe_securise',
    database: process.env.DB_NAME || 'katapult_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    timezone: '+01:00', // Pour l'heure française
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
    },
    logging: console.log,
  },
  test: {
    username: process.env.DB_USER || 'katapult_user',
    password: process.env.DB_PASSWORD || 'votre_mot_de_passe_securise',
    database: process.env.DB_NAME || 'katapult_test_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    timezone: '+01:00',
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
    },
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    timezone: '+01:00',
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
    },
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
}; 