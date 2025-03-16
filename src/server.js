// Chargement des variables d'environnement
require('dotenv').config();

// Import des modules
const app = require('./app');
const { sequelize, testConnection } = require('./config/database.config');

// Configuration
const PORT = process.env.PORT || 5000;

// Fonction de démarrage du serveur
const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    const connected = await testConnection();
    
    if (!connected) {
      console.error('Impossible de démarrer le serveur sans connexion à la base de données');
      process.exit(1);
    }

    // Synchroniser les modèles avec la base de données (ne pas utiliser {force: true} en production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Synchronisation des modèles avec la base de données...');
      // Pour le développement, on peut utiliser sync({alter: true}) pour des migrations légères
      await sequelize.sync({ alter: true });
      console.log('Modèles synchronisés avec succès');
    }
    
    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

// Gestion de l'arrêt propre du serveur
process.on('SIGINT', async () => {
  console.log('Fermeture de la connexion à la base de données...');
  try {
    await sequelize.close();
    console.log('Connexion à la base de données fermée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la fermeture de la connexion:', error);
    process.exit(1);
  }
});

process.on('uncaughtException', async (err) => {
  console.error('Exception non gérée', err);
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Erreur lors de la fermeture de la connexion:', error);
  }
  process.exit(1);
});

module.exports = app; 