const { validationResult } = require('express-validator');
const userService = require('../services/user.service');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../models');
const { Op } = require('sequelize');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');

// Génération d'un token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
  });
};

/**
 * Contrôleur de gestion de l'authentification
 */

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { firstName, lastName, email, password } = req.body;
    
    // Créer un nouvel utilisateur
    const newUser = await userService.createUser({
      firstName,
      lastName,
      email,
      password,
      role: 'candidat'
    });
    
    res.status(201).json({
      success: true,
      message: 'Inscription réussie, vous pouvez maintenant vous connecter',
      user: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    if (error.message === 'Cet email est déjà utilisé') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { email, password } = req.body;
    
    // Authentifier l'utilisateur
    const authResult = await userService.authenticateUser(email, password);
    
    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token: authResult.token,
      user: authResult.user
    });
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé' || error.message === 'Identifiants invalides') {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    if (error.message === 'Ce compte est désactivé') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// @desc    Déconnecter un utilisateur
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Déconnexion réussie',
  });
};

// @desc    Obtenir les informations de l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations',
      error: error.message,
    });
  }
};

// @desc    Mettre à jour les informations de l'utilisateur
// @route   PUT /api/auth/update-details
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, street, city, postalCode, country, notificationEmail, notificationApp } = req.body;

    // Construire l'objet de mise à jour
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (street) updateData.street = street;
    if (city) updateData.city = city;
    if (postalCode) updateData.postalCode = postalCode;
    if (country) updateData.country = country;
    if (notificationEmail !== undefined) updateData.notificationEmail = notificationEmail;
    if (notificationApp !== undefined) updateData.notificationApp = notificationApp;

    // Mettre à jour l'utilisateur
    const updatedUser = await userService.updateUser(req.user.id, updateData);

    res.status(200).json({
      success: true,
      message: 'Informations mises à jour avec succès',
      data: updatedUser
    });
  } catch (error) {
    if (error.message === 'Cet email est déjà utilisé') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des informations',
      error: error.message,
    });
  }
};

// @desc    Mettre à jour le mot de passe
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Vérifier si les mots de passe sont fournis
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir le mot de passe actuel et le nouveau mot de passe',
      });
    }

    // Vérifier si le nouveau mot de passe est suffisamment long
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      });
    }

    // Récupérer l'utilisateur
    const user = await db.User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier si le mot de passe actuel correspond
    const isPasswordValid = await user.isValidPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
      });
    }

    // Mettre à jour le mot de passe
    await userService.updateUser(user.id, {
      password: newPassword
    });

    // Générer un nouveau token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du mot de passe',
      error: error.message,
    });
  }
};

// Demande de réinitialisation de mot de passe
exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { email } = req.body;
    
    // Utiliser un bloc try...catch séparé pour l'envoi d'email afin de pouvoir retourner
    // le message générique même si l'email échoue, tout en loggant l'erreur d'email.
    try {
      const user = await userService.getUserByEmail(email); // Peut lever une erreur si non trouvé
      
      // Générer un token unique
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      // Définir une expiration (1 heure)
      const expiration = new Date(Date.now() + 60 * 60 * 1000);
      
      // Mettre à jour l'utilisateur avec le token
      await userService.updateUser(user.id, {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiration
      });
      
      // Envoyer l'email de réinitialisation
      try {
        await sendPasswordResetEmail(user.email, user.first_name, resetToken);
        
        return res.status(200).json({
          success: true,
          message: 'Instructions de réinitialisation envoyées par email.'
        });
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email de réinitialisation:", emailError);
        // Continuer pour envoyer la réponse générique même si l'email échoue,
        // mais on pourrait choisir une gestion différente ici (ex: retry, ou un message d'erreur plus spécifique).
        // Pour l'instant, on retourne le message standard pour ne pas indiquer de problème spécifique à l'utilisateur.
      }

    } catch (userError) {
      // Si l'utilisateur n'est pas trouvé (erreur de userService.getUserByEmail),
      // ou toute autre erreur avant l'envoi de l'email.
      // Ne pas divulguer si l'email existe ou non.
      // On loggue l'erreur côté serveur si ce n'est pas "Utilisateur non trouvé".
      if (userError.message !== 'Utilisateur non trouvé') {
        console.error("Erreur dans forgotPassword avant l'envoi de l'email:", userError);
      }
    }
    
    // Réponse générique si l'utilisateur n'est pas trouvé, ou si l'envoi d'email a échoué silencieusement.
    // Cela évite de révéler si un email est enregistré ou non.
    return res.status(200).json({
      success: true,
      message: 'Si cet email est associé à un compte, des instructions de réinitialisation ont été envoyées.'
    });

  } catch (error) {
    // Erreur de validation initiale ou autre erreur non prévue
    console.error("Erreur majeure dans forgotPassword:", error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation',
      error: error.message // Peut être trop verbeux pour la prod, à ajuster
    });
  }
};

// Réinitialisation du mot de passe
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { token } = req.params;
    const { password } = req.body;
    
    // Hacher le token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Chercher l'utilisateur avec ce token et vérifier qu'il n'est pas expiré
    const user = await db.User.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: { [Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
    
    // Mettre à jour le mot de passe
    await userService.updateUser(user.id, {
      password: password,
      passwordResetToken: null,
      passwordResetExpires: null
    });
    
    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès, vous pouvez maintenant vous connecter'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.message
    });
  }
};

// Fonction utilitaire pour envoyer la réponse avec le token
const sendTokenResponse = (user, statusCode, res, message) => {
  // Créer le token
  const token = user.getSignedJwtToken();

  // Options pour le cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Activer HTTPS en production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
};

// Vérifier la validité d'un token
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Aucun token fourni'
      });
    }
    
    // Vérifier la validité du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier si l'utilisateur existe
    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide - Utilisateur non trouvé'
      });
    }
    
    // Vérifier si l'utilisateur est actif
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }
    
    // Vérifier si le mot de passe a été changé après l'émission du token
    if (user.password_changed_at) {
      const changedTimestamp = parseInt(user.password_changed_at.getTime() / 1000, 10);
      
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          success: false,
          message: 'Token expiré suite à un changement de mot de passe'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Token valide',
      data: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token',
      error: error.message
    });
  }
};

// Vérification de l'email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Trouver l'utilisateur avec ce token
    const user = await db.User.findOne({ 
      where: { verification_token: token }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification invalide ou expiré',
      });
    }

    // Marquer l'utilisateur comme vérifié
    await user.update({
      is_verified: true,
      verification_token: null
    });

    // Générer un token JWT
    const jwtToken = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Email vérifié avec succès',
      token: jwtToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'email',
      error: error.message,
    });
  }
};

// Vérifier si l'utilisateur est authentifié
exports.checkAuth = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'authentification',
      error: error.message,
    });
  }
}; 