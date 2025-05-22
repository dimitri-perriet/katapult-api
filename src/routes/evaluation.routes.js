const express = require('express');
const { body } = require('express-validator');
const evaluationController = require('../controllers/evaluation.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateJWT);

// Validation pour la création/mise à jour d'une évaluation
const evaluationValidation = [
  body('criteria.innovation.score').isFloat({ min: 0, max: 5 }).withMessage('Le score d\'innovation doit être entre 0 et 5'),
  body('criteria.viability.score').isFloat({ min: 0, max: 5 }).withMessage('Le score de viabilité doit être entre 0 et 5'),
  body('criteria.impact.score').isFloat({ min: 0, max: 5 }).withMessage('Le score d\'impact doit être entre 0 et 5'),
  body('criteria.team.score').isFloat({ min: 0, max: 5 }).withMessage('Le score d\'équipe doit être entre 0 et 5'),
  body('criteria.alignment.score').isFloat({ min: 0, max: 5 }).withMessage('Le score d\'adéquation doit être entre 0 et 5'),
  body('recommendation').isIn(['accepter', 'rejeter', 'à_discuter']).withMessage('La recommandation doit être "accepter", "rejeter" ou "à_discuter"'),
];

// Validation pour la présélection
const preSelectValidation = [
  body('isPreSelected').isBoolean().withMessage('La valeur de présélection doit être un booléen'),
];

// Validation pour la décision finale
const finalDecisionValidation = [
  body('decision').isIn(['acceptée', 'refusée']).withMessage('La décision doit être "acceptée" ou "non retenue"'),
];

// Routes pour les évaluateurs et admins
router.get(
  '/assignments',
  authorizeRoles(['evaluateur', 'admin']),
  evaluationController.getEvaluatorAssignments
);

router.post(
  '/candidature/:candidatureId',
  authorizeRoles(['evaluateur', 'admin']),
  evaluationValidation,
  validateRequest,
  evaluationController.createOrUpdateEvaluation
);

router.put(
  '/:id/finalize',
  authorizeRoles(['evaluateur', 'admin']),
  evaluationController.finalizeEvaluation
);

router.get(
  '/:id',
  authorizeRoles(['evaluateur', 'admin']),
  evaluationController.getEvaluation
);

// Routes pour les admins seulement
router.get(
  '/candidature/:candidatureId',
  authorizeRoles(['admin']),
  evaluationController.getEvaluationsByCandidature
);

router.post(
  '/candidature/:candidatureId/preselect',
  authorizeRoles(['admin']),
  preSelectValidation,
  validateRequest,
  evaluationController.preSelectCandidature
);

router.post(
  '/candidature/:candidatureId/decision',
  authorizeRoles(['admin']),
  finalDecisionValidation,
  validateRequest,
  evaluationController.finalDecision
);

module.exports = router; 