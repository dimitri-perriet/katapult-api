const userService = require('../services/user.service');
const candidatureService = require('../services/candidature.service');
const { validationResult } = require('express-validator');

/**
 * Contrôleur de gestion des utilisateurs
 */

// Récupérer le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer l'utilisateur sans le mot de passe
    const user = await userService.getUserById(userId);
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};

// Mettre à jour le profil de l'utilisateur connecté
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    // Supprimer les champs qui ne doivent pas être mis à jour directement
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    
    // Convertir les noms des champs du format camelCase au format snake_case utilisé en base
    const formattedData = {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      phone: updateData.phone,
      street: updateData.street,
      city: updateData.city,
      postalCode: updateData.postalCode,
      country: updateData.country,
      notificationEmail: updateData.notificationEmail,
      notificationApp: updateData.notificationApp,
      profilePicture: updateData.profilePicture
    };
    
    // Mettre à jour l'utilisateur
    const updatedUser = await userService.updateUser(userId, formattedData);
    
    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message,
    });
  }
};

// Mettre à jour le mot de passe de l'utilisateur connecté
exports.updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Récupérer l'utilisateur avec le mot de passe
    const user = await userService.getUserByEmail(req.user.email);
    
    // Vérifier le mot de passe actuel
    const isPasswordValid = await user.isValidPassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }
    
    // Mettre à jour le mot de passe
    await userService.updateUser(userId, { password: newPassword });
    
    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du mot de passe',
      error: error.message,
    });
  }
};

// Récupérer tous les utilisateurs (admin seulement)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search, limit, offset, sort } = req.query;
    
    const users = await userService.getAllUsers({
      role,
      isActive: isActive === 'true',
      search,
      limit,
      offset,
      sort
    });
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message,
    });
  }
};

// Récupérer un utilisateur par son ID (admin seulement)
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await userService.getUserById(userId);
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message,
    });
  }
};

// Créer un nouvel utilisateur (admin seulement)
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const userData = req.body;
    
    const newUser = await userService.createUser(userData);
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: newUser
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
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message,
    });
  }
};

// Mettre à jour un utilisateur (admin seulement)
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const userId = req.params.id;
    const updateData = req.body;
    
    const updatedUser = await userService.updateUser(userId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'Cet email est déjà utilisé') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message,
    });
  }
};

// Supprimer un utilisateur (admin seulement)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    await userService.deleteUser(userId);
    
    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message,
    });
  }
};

// Récupérer les candidatures de l'utilisateur connecté
exports.getUserCandidatures = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Récupération des candidatures pour l'utilisateur ${userId}`);
    console.log('Paramètres de requête:', req.query);
    
    // Options de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Options de filtrage
    const options = {
      userId: userId,
      limit: limit,
      offset: offset
    };
    
    // Gérer le tri - adapter les noms de champs frontend -> backend
    if (req.query.sort) {
      // Si le nom de tri vient du frontend (camelCase), le convertir en snake_case pour le backend
      let sortField = req.query.sort;
      if (sortField === 'createdAt') sortField = 'created_at';
      if (sortField === 'updatedAt') sortField = 'updated_at';
      
      const order = req.query.order || 'DESC';
      options.sort = `${sortField}:${order}`;
    } else {
      options.sort = 'updated_at:DESC';
    }
    
    console.log('Options de filtrage préparées:', options);
    
    // Ajout des filtres optionnels
    if (req.query.status) {
      options.status = req.query.status;
    }
    
    if (req.query.promotion) {
      options.promotion = req.query.promotion;
    }
    
    if (req.query.search) {
      options.search = req.query.search;
    }
    
    console.log('Appel du service avec options:', options);
    
    // Récupérer les candidatures de l'utilisateur
    const candidatures = await candidatureService.getAllCandidatures(options);
    console.log(`${candidatures.length} candidatures trouvées`);
    
    // Formater les données pour l'affichage
    const formattedCandidatures = candidatures.map(c => {
      let ficheIdentite = {};
      let projetUtiliteSociale = {};
      
      try {
        ficheIdentite = typeof c.fiche_identite === 'string' && c.fiche_identite ? 
          JSON.parse(c.fiche_identite) : (c.fiche_identite || {});
      } catch (e) {
        console.error('Erreur lors du parsing de fiche_identite:', e);
      }
      
      try {
        projetUtiliteSociale = typeof c.projet_utilite_sociale === 'string' && c.projet_utilite_sociale ?
          JSON.parse(c.projet_utilite_sociale) : (c.projet_utilite_sociale || {});
      } catch (e) {
        console.error('Erreur lors du parsing de projet_utilite_sociale:', e);
      }
      
      return {
        id: c.id,
        projectName: ficheIdentite.projectName || 'Sans nom',
        sector: ficheIdentite.sector || 'Non spécifié',
        status: c.status,
        promotion: c.promotion || 'Non spécifiée',
        maturityLevel: projetUtiliteSociale.maturityLevel,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        submissionDate: c.submission_date,
        user: c.user ? {
          id: c.user.id,
          firstName: c.user.first_name,
          lastName: c.user.last_name,
          email: c.user.email
        } : null
      };
    });
    
    // Compter le nombre total pour la pagination
    const totalOptions = { ...options };
    delete totalOptions.limit;
    delete totalOptions.offset;
    const totalCandidatures = await candidatureService.getAllCandidatures(totalOptions);
    
    const response = {
      success: true,
      count: candidatures.length,
      total: totalCandidatures.length,
      totalPages: Math.ceil(totalCandidatures.length / limit),
      currentPage: page,
      candidatures: formattedCandidatures
    };
    
    console.log('Réponse préparée avec succès');
    res.status(200).json(response);
  } catch (error) {
    console.error('Erreur dans getUserCandidatures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des candidatures',
      error: error.message
    });
  }
}; 