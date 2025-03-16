const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateJWT);

// Validation pour la mise à jour du profil
const updateProfileValidation = [
  body('firstName').optional().notEmpty().withMessage('Le prénom ne peut pas être vide'),
  body('lastName').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
];

// Validation pour le changement de mot de passe
const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères'),
];

// Validation pour la création d'utilisateur (admin uniquement)
const createUserValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
  body('role').isIn(['candidat', 'evaluateur', 'admin']).withMessage('Le rôle doit être "candidat", "evaluateur" ou "admin"'),
];

// Routes pour tous les utilisateurs authentifiés
router.get('/profile', userController.getProfile);
router.put(
  '/profile',
  updateProfileValidation,
  validateRequest,
  userController.updateProfile
);
router.put(
  '/change-password',
  changePasswordValidation,
  validateRequest,
  userController.updatePassword
);

// Route pour récupérer les candidatures de l'utilisateur connecté
router.get('/candidatures', userController.getUserCandidatures);

// Routes pour les admins seulement
router.get(
  '/',
  authorizeRoles(['admin']),
  userController.getAllUsers
);

router.post(
  '/',
  authorizeRoles(['admin']),
  createUserValidation,
  validateRequest,
  userController.createUser
);

router.get(
  '/:id',
  authorizeRoles(['admin']),
  userController.getUserById
);

router.put(
  '/:id',
  authorizeRoles(['admin']),
  updateProfileValidation,
  validateRequest,
  userController.updateUser
);

router.delete(
  '/:id',
  authorizeRoles(['admin']),
  userController.deleteUser
);

module.exports = router; 