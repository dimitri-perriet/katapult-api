const db = require('../../models');
const mondayService = require('./monday.service'); // Ajout de l'import du service Monday
const emailService = require('./email.service'); // Ajout de l'import du service Email

const { Op } = require('sequelize');

/**
 * Service de gestion des candidatures
 */
class CandidatureService {
  /**
   * Récupérer toutes les candidatures
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array>} Liste de candidatures
   */
  async getAllCandidatures(options = {}) {
    const { status, promotion, userId, search, limit, offset, sort } = options;
    
    // Construction des conditions de recherche
    const whereConditions = {};
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (promotion) {
      whereConditions.promotion = promotion;
    }
    
    if (userId) {
      whereConditions.user_id = userId;
    }
    
    if (search) {
      whereConditions[Op.or] = [
        { project_name: { [Op.like]: `%${search}%` } },
        { project_description: { [Op.like]: `%${search}%` } },
        { sector: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Options de requête
    const queryOptions = {
      where: whereConditions,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
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
    
    return await db.Candidature.findAll(queryOptions);
  }
  
  /**
   * Récupérer une candidature par son ID
   * @param {number} candidatureId - ID de la candidature
   * @param {boolean} includeDetails - Inclure les détails associés
   * @returns {Promise<Object>} Candidature trouvée
   */
  async getCandidatureById(candidatureId, includeDetails = false) {
    const queryOptions = {
      where: { id: candidatureId },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    };
    
    // Si on souhaite inclure les détails associés
    if (includeDetails) {
      queryOptions.include.push(
        {
          model: db.ProjectTeam,
          as: 'teamMembers'
        },
        {
          model: db.Document,
          as: 'documents'
        },
        {
          model: db.Evaluation,
          as: 'evaluations',
          include: [
            {
              model: db.User,
              as: 'evaluator',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }
          ]
        }
      );
    }
    
    const candidature = await db.Candidature.findOne(queryOptions);
    
    if (!candidature) {
      throw new Error('Candidature non trouvée');
    }
    
    return candidature;
  }
  
  /**
   * Créer une nouvelle candidature
   * @param {Object} candidatureData - Données de la candidature
   * @param {number} userId - ID de l'utilisateur qui crée la candidature
   * @returns {Promise<Object>} Candidature créée
   */
  async createCandidature(candidatureData, userId) {
    // Vérifier si l'utilisateur existe
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Logs pour vérifier les données avant la création
    console.log("[SERVICE CREATE] equipe_projet AVANT CREATE:", JSON.stringify(candidatureData.equipe_projet));
    console.log("[SERVICE CREATE] etat_avancement AVANT CREATE:", JSON.stringify(candidatureData.etat_avancement));
    console.log("[SERVICE CREATE] completion_percentage AVANT CREATE:", candidatureData.completion_percentage);

    // Créer la candidature avec la nouvelle structure JSON
    const newCandidatureData = {
      user_id: userId,
      promotion: candidatureData.promotion,
      phone: candidatureData.phone || '',
      fiche_identite: candidatureData.fiche_identite,
      projet_utilite_sociale: candidatureData.projet_utilite_sociale,
      qui_est_concerne: candidatureData.qui_est_concerne,
      modele_economique: candidatureData.modele_economique,
      parties_prenantes: candidatureData.parties_prenantes,
      equipe_projet: candidatureData.equipe_projet,
      documents_json: candidatureData.documents_json || [],
      completion_percentage: candidatureData.completion_percentage || 0,
      etat_avancement: candidatureData.etat_avancement || {},
      structure_juridique: candidatureData.structure_juridique || {},
      status: candidatureData.status || 'brouillon'
    };
    
    // Si le statut est 'soumise' lors de la création, ajouter la date de soumission
    if (newCandidatureData.status === 'soumise' && !newCandidatureData.submission_date) {
        newCandidatureData.submission_date = new Date();
    }

    const newCandidature = await db.Candidature.create(newCandidatureData);
    
    // Si la candidature possède des membres d'équipe dans l'ancienne structure, les créer
    if (candidatureData.teamMembers && candidatureData.teamMembers.length > 0) {
      const teamMembersToCreate = candidatureData.teamMembers.map(member => ({
        candidature_id: newCandidature.id,
        member_name: member.name,
        member_role: member.role,
        member_expertise: member.expertise || null
      }));
      
      await db.ProjectTeam.bulkCreate(teamMembersToCreate);
    }
    
    // Envoi de l'email de confirmation si la candidature est soumise directement
    if (newCandidature.status === 'soumise') {
      const emailData = {
        firstName: user.first_name,
        lastName: user.last_name,
        applicationName: newCandidature.fiche_identite?.projectName || 'Votre projet',
        applicationStatus: 'Soumise',
        applicationLink: `${process.env.FRONTEND_URL}/candidatures/${newCandidature.id}`,
        submissionDate: newCandidature.submission_date ? newCandidature.submission_date.toLocaleDateString('fr-FR') : 'N/A',
        apiBaseUrl: process.env.API_BASE_URL
      };
      emailService.sendEmailFromTemplate(user.email, 'submission_confirmation', emailData)
        .catch(err => console.error('Failed to send submission confirmation email:', err));
    }
    
    return this.getCandidatureById(newCandidature.id, true);
  }
  
  /**
   * Mettre à jour une candidature
   * @param {number} candidatureId - ID de la candidature
   * @param {Object} updateData - Données à mettre à jour
   * @param {Object} [currentUser] - Informations sur l'utilisateur effectuant la mise à jour (optionnel, pour logs ou droits)
   * @returns {Promise<Object>} Candidature mise à jour
   */
  async updateCandidature(candidatureId, updateData, currentUser) {
    const candidature = await db.Candidature.findByPk(candidatureId, {
      include: [{ model: db.User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name'] }]
    });
    
    if (!candidature) {
      throw new Error('Candidature non trouvée');
    }

    const oldStatus = candidature.status;
    const newStatus = updateData.status;
    
    // Préparer les données à mettre à jour
    const dataToUpdate = {};
    
    // Logs pour vérifier les données avant la mise à jour
    if (updateData.equipe_projet) {
      console.log("[SERVICE UPDATE] equipe_projet DANS updateData:", JSON.stringify(updateData.equipe_projet));
    }
    if (updateData.etat_avancement) {
      console.log("[SERVICE UPDATE] etat_avancement DANS updateData:", JSON.stringify(updateData.etat_avancement));
    }
    if (updateData.completion_percentage !== undefined) {
      console.log("[SERVICE UPDATE] completion_percentage DANS updateData:", updateData.completion_percentage);
    }

    // Mise à jour des champs simples
    if (updateData.promotion) dataToUpdate.promotion = updateData.promotion;
    if (updateData.status) dataToUpdate.status = updateData.status;
    // Si le statut passe à 'soumise' et qu'il n'y a pas de date de soumission, l'ajouter
    if (newStatus === 'soumise' && oldStatus !== 'soumise' && !candidature.submission_date && !updateData.submission_date) {
        dataToUpdate.submission_date = new Date();
    } else if (updateData.submission_date) {
        dataToUpdate.submission_date = updateData.submission_date;
    }
    if (updateData.monday_item_id) dataToUpdate.monday_item_id = updateData.monday_item_id;
    if (updateData.generated_pdf_url) dataToUpdate.generated_pdf_url = updateData.generated_pdf_url;
    if (updateData.phone !== undefined) dataToUpdate.phone = updateData.phone;
    if (updateData.completion_percentage !== undefined) dataToUpdate.completion_percentage = updateData.completion_percentage;
    
    // Mise à jour des sections complexes (JSON)
    if (updateData.fiche_identite) {
      dataToUpdate.fiche_identite = updateData.fiche_identite;
    }
    
    if (updateData.projet_utilite_sociale) {
      dataToUpdate.projet_utilite_sociale = updateData.projet_utilite_sociale;
    }
    
    if (updateData.qui_est_concerne) {
      dataToUpdate.qui_est_concerne = updateData.qui_est_concerne;
    }
    
    if (updateData.modele_economique) {
      dataToUpdate.modele_economique = updateData.modele_economique;
    }
    
    if (updateData.parties_prenantes) {
      dataToUpdate.parties_prenantes = updateData.parties_prenantes;
    }
    
    if (updateData.equipe_projet) {
      dataToUpdate.equipe_projet = updateData.equipe_projet;
    }
    
    if (updateData.documents_json) {
      dataToUpdate.documents_json = updateData.documents_json;
    }
    
    if (updateData.etat_avancement) {
      dataToUpdate.etat_avancement = updateData.etat_avancement;
    }
    
    if (updateData.structure_juridique) {
      dataToUpdate.structure_juridique = updateData.structure_juridique;
    }
    
    // Logs pour vérifier dataToUpdate juste avant l'appel à candidature.update()
    if (dataToUpdate.equipe_projet) {
      console.log("[SERVICE UPDATE] equipe_projet AVANT DB UPDATE:", JSON.stringify(dataToUpdate.equipe_projet));
    }
    if (dataToUpdate.etat_avancement) {
      console.log("[SERVICE UPDATE] etat_avancement AVANT DB UPDATE:", JSON.stringify(dataToUpdate.etat_avancement));
    }
    if (dataToUpdate.completion_percentage !== undefined) {
      console.log("[SERVICE UPDATE] completion_percentage AVANT DB UPDATE:", dataToUpdate.completion_percentage);
    }

    // Mise à jour de la candidature
    await candidature.update(dataToUpdate);
    await candidature.reload(); // Recharger pour avoir les dernières données, y compris l'utilisateur
    
    // Mise à jour des membres de l'équipe si fournis dans l'ancienne structure
    if (updateData.teamMembers) {
      // Supprimer les membres actuels
      await db.ProjectTeam.destroy({ where: { candidature_id: candidatureId } });
      
      // Ajouter les nouveaux membres
      if (updateData.teamMembers.length > 0) {
        const teamMembersToCreate = updateData.teamMembers.map(member => ({
          candidature_id: candidatureId,
          member_name: member.name,
          member_role: member.role,
          member_expertise: member.expertise || null
        }));
        
        await db.ProjectTeam.bulkCreate(teamMembersToCreate);
      }
    }
    
    // Envoi de l'email de changement de statut
    if (newStatus && newStatus !== oldStatus) {
      let templateName = null;
      let statusLabel = newStatus; // Pour l'email

      switch (newStatus) {
        case 'soumise':
          templateName = 'application_status_submitted'; // Utilisé si le statut change vers soumise APRES création
          statusLabel = 'Soumise';
          break;
        case 'en_evaluation':
          templateName = 'application_status_review';
          statusLabel = 'En cours d\'évaluation';
          break;
        case 'acceptee':
          templateName = 'application_status_accepted';
          statusLabel = 'Acceptée';
          break;
        case 'rejetee':
          templateName = 'application_status_rejected';
          statusLabel = 'Rejetée';
          break;
        case 'brouillon':
          templateName = 'application_status_draft_return'; // Renvoyée en brouillon
          statusLabel = 'Renvoyée en brouillon';
          break;
        // Ajoutez d'autres statuts si nécessaire
      }

      if (templateName && candidature.user) {
        const emailData = {
          firstName: candidature.user.first_name,
          lastName: candidature.user.last_name,
          applicationName: candidature.fiche_identite?.projectName || 'Votre projet',
          applicationStatus: statusLabel,
          applicationLink: `${process.env.FRONTEND_URL}/candidatures/${candidature.id}`,
          submissionDate: candidature.submission_date ? candidature.submission_date.toLocaleDateString('fr-FR') : '',
          adminNotes: updateData.adminNotes || '',
          apiBaseUrl: process.env.API_BASE_URL
        };
        emailService.sendEmailFromTemplate(candidature.user.email, templateName, emailData)
          .catch(err => console.error(`Failed to send status change email for template ${templateName}:`, err));
      }
    }
    
    // Si le statut a changé, synchroniser avec Monday.com
    const updatedCandidature = await this.syncCandidatureWithMonday(candidatureId);
    
    return updatedCandidature;
  }
  
  /**
   * Supprimer une candidature
   * @param {number} candidatureId - ID de la candidature
   * @returns {Promise<boolean>} Résultat de la suppression
   */
  async deleteCandidature(candidatureId) {
    const candidature = await db.Candidature.findByPk(candidatureId);
    
    if (!candidature) {
      throw new Error('Candidature non trouvée');
    }
    
    // Les suppressions en cascade s'occuperont des données associées
    await candidature.destroy();
    return true;
  }
  
  /**
   * Changer le statut d'une candidature
   * @param {number} candidatureId - ID de la candidature
   * @param {string} newStatus - Nouveau statut
   * @returns {Promise<Object>} Candidature mise à jour
   */
  async changeCandidatureStatus(candidatureId, newStatus) {
    const candidature = await db.Candidature.findByPk(candidatureId);
    
    if (!candidature) {
      throw new Error('Candidature non trouvée');
    }
    
    const validStatuses = ['brouillon', 'soumise', 'en_evaluation', 'acceptee', 'rejetee'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Statut invalide');
    }
    
    await candidature.update({ status: newStatus });
    
    return candidature;
  }
  
  /**
   * Ajouter un document à une candidature
   * @param {number} candidatureId - ID de la candidature
   * @param {Object} documentData - Données du document
   * @returns {Promise<Object>} Document créé
   */
  async addDocument(candidatureId, documentData) {
    const candidature = await db.Candidature.findByPk(candidatureId);
    
    if (!candidature) {
      throw new Error('Candidature non trouvée');
    }
    
    const newDocument = await db.Document.create({
      candidature_id: candidatureId,
      type: documentData.type,
      filename: documentData.filename,
      path: documentData.path,
      original_name: documentData.originalName,
      mime_type: documentData.mimeType,
      size: documentData.size,
      description: documentData.description || null
    });
    
    return newDocument;
  }
  
  /**
   * Supprimer un document
   * @param {number} documentId - ID du document
   * @returns {Promise<boolean>} Résultat de la suppression
   */
  async deleteDocument(documentId) {
    const document = await db.Document.findByPk(documentId);
    
    if (!document) {
      throw new Error('Document non trouvé');
    }
    
    await document.destroy();
    return true;
  }
  
  /**
   * Synchroniser une candidature avec Monday.com
   * @param {number} candidatureId - ID de la candidature
   * @returns {Promise<boolean>} Résultat de la synchronisation
   */
  async syncCandidatureWithMonday(candidatureId) {
    try {
      // Utiliser directement la fonction syncCandidature du service Monday
      // qui gère déjà toute la logique de création/mise à jour
      const result = await mondayService.syncWithMonday.syncCandidature(candidatureId);
      
      if (result) {
        console.log(`Synchronisation réussie de la candidature ${candidatureId} avec Monday.com`);
        return true;
      } else {
        console.log(`Aucune donnée retournée lors de la synchronisation de la candidature ${candidatureId}`);
        return false;
      }
    } catch (error) {
      console.error(`Erreur lors de la synchronisation avec Monday.com:`, error);
      throw error;
    }
  }
  
  /**
   * Récupérer les statistiques des candidatures
   * @returns {Promise<Object>} Statistiques des candidatures
   */
  async getStatistics() {
    try {
      // Compter le nombre total de candidatures
      const total = await db.Candidature.count();
      
      // Compter le nombre de candidatures par statut
      const submitted = await db.Candidature.count({ where: { status: 'soumise' } });
      const inReview = await db.Candidature.count({ where: { status: 'en_evaluation' } });
      const accepted = await db.Candidature.count({ where: { status: 'acceptee' } });
      const rejected = await db.Candidature.count({ where: { status: 'rejetee' } });
      
      return {
        total,
        submitted,
        inReview,
        accepted,
        rejected
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}

module.exports = new CandidatureService();