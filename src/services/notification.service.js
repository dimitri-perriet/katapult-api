const db = require('../../models');

const { Op } = require('sequelize');

/**
 * Service de gestion des notifications
 */
class NotificationService {
  /**
   * Récupérer toutes les notifications d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array>} Liste de notifications
   */
  async getUserNotifications(userId, options = {}) {
    const { isRead, type, limit, offset } = options;
    
    // Construction des conditions de recherche
    const whereConditions = { user_id: userId };
    
    if (isRead !== undefined) {
      whereConditions.is_read = isRead;
    }
    
    if (type) {
      whereConditions.type = type;
    }
    
    // Options de requête
    const queryOptions = {
      where: whereConditions,
      order: [['created_at', 'DESC']]
    };
    
    if (limit && limit > 0) {
      queryOptions.limit = parseInt(limit);
    }
    
    if (offset && offset >= 0) {
      queryOptions.offset = parseInt(offset);
    }
    
    return await Notification.findAll(queryOptions);
  }
  
  /**
   * Récupérer le nombre de notifications non lues d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de notifications non lues
   */
  async getUnreadNotificationsCount(userId) {
    return await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });
  }
  
  /**
   * Récupérer une notification par son ID
   * @param {number} notificationId - ID de la notification
   * @returns {Promise<Object>} Notification trouvée
   */
  async getNotificationById(notificationId) {
    const notification = await Notification.findByPk(notificationId);
    
    if (!notification) {
      throw new Error('Notification non trouvée');
    }
    
    return notification;
  }
  
  /**
   * Créer une nouvelle notification
   * @param {Object} notificationData - Données de la notification
   * @returns {Promise<Object>} Notification créée
   */
  async createNotification(notificationData) {
    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(notificationData.userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Créer la notification
    const newNotification = await Notification.create({
      user_id: notificationData.userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info',
      is_read: false
    });
    
    return newNotification;
  }
  
  /**
   * Créer des notifications pour plusieurs utilisateurs
   * @param {Array<number>} userIds - IDs des utilisateurs
   * @param {Object} notificationData - Données de la notification
   * @returns {Promise<Array>} Notifications créées
   */
  async createNotificationsForMultipleUsers(userIds, notificationData) {
    // Vérifier que les utilisateurs existent
    const users = await User.findAll({
      where: {
        id: { [Op.in]: userIds }
      }
    });
    
    if (users.length === 0) {
      throw new Error('Aucun utilisateur trouvé');
    }
    
    // Créer les notifications pour chaque utilisateur
    const notificationsToCreate = users.map(user => ({
      user_id: user.id,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info',
      is_read: false
    }));
    
    const createdNotifications = await Notification.bulkCreate(notificationsToCreate);
    
    return createdNotifications;
  }
  
  /**
   * Marquer une notification comme lue
   * @param {number} notificationId - ID de la notification
   * @returns {Promise<Object>} Notification mise à jour
   */
  async markNotificationAsRead(notificationId) {
    const notification = await this.getNotificationById(notificationId);
    
    if (notification.is_read) {
      return notification; // Déjà lue
    }
    
    await notification.update({ is_read: true });
    
    return notification;
  }
  
  /**
   * Marquer toutes les notifications d'un utilisateur comme lues
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de notifications mises à jour
   */
  async markAllNotificationsAsRead(userId) {
    const [updatedCount] = await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );
    
    return updatedCount;
  }
  
  /**
   * Supprimer une notification
   * @param {number} notificationId - ID de la notification
   * @returns {Promise<boolean>} Résultat de la suppression
   */
  async deleteNotification(notificationId) {
    const notification = await this.getNotificationById(notificationId);
    
    await notification.destroy();
    return true;
  }
  
  /**
   * Supprimer toutes les notifications lues d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de notifications supprimées
   */
  async deleteReadNotifications(userId) {
    const deletedCount = await Notification.destroy({
      where: {
        user_id: userId,
        is_read: true
      }
    });
    
    return deletedCount;
  }
}

module.exports = new NotificationService(); 