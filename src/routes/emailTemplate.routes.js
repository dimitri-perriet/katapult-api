const express = require('express');
const { body } = require('express-validator');
const emailTemplateController = require('../controllers/emailTemplate.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes pour les templates nécessitent l'authentification et le rôle admin
router.use(authenticateJWT, authorizeRoles(['admin']));

// Validation pour la création et la mise à jour de template
const templateValidation = [
  body('subject').optional().notEmpty().withMessage('Le sujet ne peut pas être vide.'),
  body('body').optional().notEmpty().withMessage('Le corps du template ne peut pas être vide.'),
  // Pour la création, name est requis
  body('name').if(body('description').not().exists()) // Astuce pour que name soit requis seulement si c'est une création
    .notEmpty().withMessage('Le nom du template est requis pour la création.')
];

const createTemplateValidation = [
    body('name').notEmpty().withMessage('Le nom (identifiant unique) du template est requis.')
        .isSlug().withMessage('Le nom du template doit être un slug (ex: mon-template-nom).'),
    body('subject').notEmpty().withMessage('Le sujet est requis.'),
    body('body').notEmpty().withMessage('Le corps du template est requis.'),
    body('description').optional().isString(),
];

const updateTemplateValidation = [
    body('subject').optional().isString().notEmpty().withMessage('Le sujet ne peut être vide s\'il est fourni.'),
    body('body').optional().isString().notEmpty().withMessage('Le corps ne peut être vide s\'il est fourni.'),
    body('description').optional().isString(),
];


// GET /api/email-templates - Lister tous les templates
router.get(
  '/',
  emailTemplateController.getAllTemplates
);

// GET /api/email-templates/:id - Récupérer un template par ID
router.get(
  '/:id',
  emailTemplateController.getTemplateById
);

// PUT /api/email-templates/:id - Mettre à jour un template par ID
router.put(
  '/:id',
  updateTemplateValidation,
  validateRequest,
  emailTemplateController.updateTemplate
);

// POST /api/email-templates - Créer un nouveau template (usage limité, par ex. pour initialisation)
router.post(
  '/',
  createTemplateValidation,
  validateRequest,
  emailTemplateController.createTemplate
);

module.exports = router; 