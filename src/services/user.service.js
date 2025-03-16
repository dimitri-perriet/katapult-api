const db = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Service de gestion des utilisateurs
 */
class UserService {
  /**
   * Récupérer tous les utilisateurs
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array>} Liste d'utilisateurs
   */
  async getAllUsers(options = {}) {
    const { role, isActive, search, limit, offset, sort } = options;
    
    // Construction des conditions de recherche
    const whereConditions = {};
    
    if (role) {
      whereConditions.role = role;
    }
    
    if (isActive !== undefined) {
      whereConditions.is_active = isActive;
    }
    
    if (search) {
      whereConditions[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Options de pagination et tri
    const queryOptions = {
      where: whereConditions,
      attributes: { exclude: ['password'] }
    };
    
    if (limit && limit > 0) {
      queryOptions.limit = parseInt(limit);
    }
    
    if (offset && offset >= 0) {
      queryOptions.offset = parseInt(offset);
    }
    
    if (sort) {
      const [field, order] = sort.split(':');
      queryOptions.order = [[field, order || 'ASC']];
    } else {
      queryOptions.order = [['created_at', 'DESC']];
    }
    
    return await db.User.findAll(queryOptions);
  }
  
  /**
   * Récupérer un utilisateur par son ID
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Utilisateur trouvé
   */
  async getUserById(userId) {
    const user = await db.User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    return user;
  }
  
  /**
   * Récupérer un utilisateur par son email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object>} Utilisateur trouvé
   */
  async getUserByEmail(email) {
    const user = await db.User.findOne({
      where: { email },
      attributes: { include: ['password'] } // Inclure le mot de passe pour l'authentification
    });
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    return user;
  }
  
  /**
   * Créer un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<Object>} Utilisateur créé
   */
  async createUser(userData) {
    // Vérifier si l'email existe déjà
    const existingUser = await db.User.findOne({
      where: { email: userData.email }
    });
    
    if (existingUser) {
      throw new Error('Cet email est déjà utilisé');
    }
    
    // Création de l'utilisateur
    const newUser = await db.User.create({
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      password: userData.password, // Le hook beforeCreate s'occupera du hashage
      role: userData.role || 'candidat',
      phone: userData.phone,
      street: userData.street,
      city: userData.city,
      postal_code: userData.postalCode,
      country: userData.country || 'France',
      notification_email: userData.notificationEmail !== false,
      notification_app: userData.notificationApp !== false
    });
    
    return {
      id: newUser.id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      role: newUser.role
    };
  }
  
  /**
   * Mettre à jour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Object>} Utilisateur mis à jour
   */
  async updateUser(userId, updateData) {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Si l'email est modifié, vérifier s'il n'est pas déjà utilisé
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await db.User.findOne({
        where: { 
          email: updateData.email,
          id: { [Op.ne]: userId }
        }
      });
      
      if (existingUser) {
        throw new Error('Cet email est déjà utilisé');
      }
    }
    
    // Préparer les données à mettre à jour
    const dataToUpdate = {};
    
    if (updateData.firstName) dataToUpdate.first_name = updateData.firstName;
    if (updateData.lastName) dataToUpdate.last_name = updateData.lastName;
    if (updateData.email) dataToUpdate.email = updateData.email;
    if (updateData.password) dataToUpdate.password = updateData.password;
    if (updateData.role) dataToUpdate.role = updateData.role;
    if (updateData.isActive !== undefined) dataToUpdate.is_active = updateData.isActive;
    if (updateData.phone) dataToUpdate.phone = updateData.phone;
    if (updateData.street) dataToUpdate.street = updateData.street;
    if (updateData.city) dataToUpdate.city = updateData.city;
    if (updateData.postalCode) dataToUpdate.postal_code = updateData.postalCode;
    if (updateData.country) dataToUpdate.country = updateData.country;
    if (updateData.notificationEmail !== undefined) dataToUpdate.notification_email = updateData.notificationEmail;
    if (updateData.notificationApp !== undefined) dataToUpdate.notification_app = updateData.notificationApp;
    if (updateData.profilePicture) dataToUpdate.profile_picture = updateData.profilePicture;
    if (updateData.passwordResetToken) dataToUpdate.password_reset_token = updateData.passwordResetToken;
    if (updateData.passwordResetExpires) dataToUpdate.password_reset_expires = updateData.passwordResetExpires;
    
    // Mise à jour de l'utilisateur
    await user.update(dataToUpdate);
    
    // Récupérer l'utilisateur mis à jour sans le mot de passe
    const updatedUser = await db.User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    return updatedUser;
  }
  
  /**
   * Supprimer un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} Résultat de la suppression
   */
  async deleteUser(userId) {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    await user.destroy();
    return true;
  }
  
  /**
   * Authentifier un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Informations d'authentification
   */
  async authenticateUser(email, password) {
    const user = await this.getUserByEmail(email);
    
    // Vérifier le mot de passe
    const isPasswordValid = await user.isValidPassword(password);
    
    if (!isPasswordValid) {
      throw new Error('Identifiants invalides');
    }
    
    // Vérifier si le compte est actif
    if (!user.is_active) {
      throw new Error('Ce compte est désactivé');
    }
    
    // Mettre à jour la date de dernière connexion
    await user.update({ last_login: new Date() });
    
    // Générer le token JWT
    const token = user.generateAuthToken();
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    };
  }
}

module.exports = new UserService(); 