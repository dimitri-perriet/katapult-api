const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth.routes');
const candidatureRoutes = require('./routes/candidature.routes');
const evaluationRoutes = require('./routes/evaluation.routes');
const userRoutes = require('./routes/user.routes');
const mondayRoutes = require('./routes/monday.routes');
const emailTemplateRoutes = require('./routes/emailTemplate.routes');

// Initialisation de l'application Express
const app = express();

// Servir les fichiers statiques du dossier 'public'
// Le chemin est relatif à l'emplacement de app.js (dans src/), donc ../public pour remonter d'un niveau
app.use(express.static(path.join(__dirname, '../public')));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Middleware pour ajouter les en-têtes de sécurité
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Middleware pour gérer les erreurs CORS
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
  next(err);
});

// Définition du préfixe /backend pour toutes les routes
const apiRouter = express.Router();
app.use('/backend', apiRouter);

// Routes
apiRouter.use('/api/auth', authRoutes);
apiRouter.use('/api/candidatures', candidatureRoutes);
apiRouter.use('/api/evaluations', evaluationRoutes);
apiRouter.use('/api/users', userRoutes);
apiRouter.use('/api/monday', mondayRoutes);
apiRouter.use('/api/email-templates', emailTemplateRoutes);

// Route de base
apiRouter.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API Katapult!' });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route non trouvée !',
    path: req.originalUrl
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erreur serveur', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

module.exports = app; 