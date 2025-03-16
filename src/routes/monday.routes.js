const express = require('express');
const mondayController = require('../controllers/monday.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes nécessitent l'authentification et le rôle admin
router.use(authenticateJWT);
router.use(authorizeRoles(['admin']));

// Routes pour synchroniser avec Monday.com
router.post('/sync/candidature/:id', mondayController.syncCandidature);
router.post('/sync/all', mondayController.syncAllCandidatures);
router.get('/boards', mondayController.getBoards);
router.get('/boards/:boardId/columns', mondayController.getBoardColumns);
router.post('/webhook/setup', mondayController.setupWebhook);
router.get('/status', mondayController.getConnectionStatus);

module.exports = router; 