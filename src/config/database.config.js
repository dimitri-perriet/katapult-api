const { Sequelize } = require('sequelize');
const config = require('../../config/database');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    timezone: dbConfig.timezone,
    define: dbConfig.define,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

// Fonction pour tester la connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données MySQL établie avec succès.');
    return true;
  } catch (error) {
    console.error('Impossible de se connecter à la base de données MySQL:', error);
    return false;
  }
};

// Initialisation des modèles
const initModels = () => {
  const db = require('../../models');
  return db;
};

module.exports = {
  sequelize,
  testConnection,
  initModels
}; 