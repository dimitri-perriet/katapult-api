const db = require('../../models');

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
    
    // Créer la candidature avec la nouvelle structure JSON
    const newCandidature = await db.Candidature.create({
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
      completed_sections: candidatureData.completed_sections,
      status: candidatureData.status || 'brouillon'
    });
    
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
    
    return this.getCandidatureById(newCandidature.id, true);
  }
  
  /**
   * Mettre à jour une candidature
   * @param {number} candidatureId - ID de la candidature
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Object>} Candidature mise à jour
   */
  async updateCandidature(candidatureId, updateData) {
    const candidature = await db.Candidature.findByPk(candidatureId);
    
    if (!candidature) {
      throw new Error('Candidature non trouvée');
    }
    
    // Préparer les données à mettre à jour
    const dataToUpdate = {};
    
    // Mise à jour des champs simples
    if (updateData.promotion) dataToUpdate.promotion = updateData.promotion;
    if (updateData.status) dataToUpdate.status = updateData.status;
    if (updateData.submission_date) dataToUpdate.submission_date = updateData.submission_date;
    if (updateData.monday_item_id) dataToUpdate.monday_item_id = updateData.monday_item_id;
    if (updateData.generated_pdf_url) dataToUpdate.generated_pdf_url = updateData.generated_pdf_url;
    
    // Mise à jour des sections complexes (JSON)
    if (updateData.fiche_identite) {
      const existingData = candidature.fiche_identite || {};
      dataToUpdate.fiche_identite = { ...existingData, ...updateData.fiche_identite };
      // Mise à jour de la section complétée
      this.updateCompletedSection(candidature, 'ficheIdentite', true);
    }
    
    if (updateData.projet_utilite_sociale) {
      const existingData = candidature.projet_utilite_sociale || {};
      dataToUpdate.projet_utilite_sociale = { ...existingData, ...updateData.projet_utilite_sociale };
      this.updateCompletedSection(candidature, 'projetUtiliteSociale', true);
    }
    
    if (updateData.qui_est_concerne) {
      const existingData = candidature.qui_est_concerne || {};
      dataToUpdate.qui_est_concerne = { ...existingData, ...updateData.qui_est_concerne };
      this.updateCompletedSection(candidature, 'quiEstConcerne', true);
    }
    
    if (updateData.modele_economique) {
      const existingData = candidature.modele_economique || {};
      dataToUpdate.modele_economique = { ...existingData, ...updateData.modele_economique };
      this.updateCompletedSection(candidature, 'modeleEconomique', true);
    }
    
    if (updateData.parties_prenantes) {
      const existingData = candidature.parties_prenantes || {};
      dataToUpdate.parties_prenantes = { ...existingData, ...updateData.parties_prenantes };
      this.updateCompletedSection(candidature, 'partiesPrenantes', true);
    }
    
    if (updateData.equipe_projet) {
      const existingData = candidature.equipe_projet || {};
      dataToUpdate.equipe_projet = { ...existingData, ...updateData.equipe_projet };
      this.updateCompletedSection(candidature, 'equipeProjet', true);
    }
    
    if (updateData.documents_json) {
      const existingData = candidature.documents_json || [];
      dataToUpdate.documents_json = [...existingData, ...updateData.documents_json];
      this.updateCompletedSection(candidature, 'documents', true);
    }
    
    if (updateData.completed_sections) {
      const existingData = candidature.completed_sections || {};
      dataToUpdate.completed_sections = { ...existingData, ...updateData.completed_sections };
    }
    
    // Mise à jour de la candidature
    await candidature.update(dataToUpdate);
    
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
    
    return this.getCandidatureById(candidatureId, true);
  }
  
  /**
   * Mettre à jour une section complétée dans une candidature
   * @param {Object} candidature - Objet candidature
   * @param {string} section - Nom de la section
   * @param {boolean} value - Valeur à définir
   * @private
   */
  updateCompletedSection(candidature, section, value) {
    if (!candidature.completed_sections) {
      candidature.completed_sections = {};
    }
    
    // Convertir en objet si c'est une chaîne JSON
    const sections = typeof candidature.completed_sections === 'string'
      ? JSON.parse(candidature.completed_sections)
      : candidature.completed_sections;
    
    sections[section] = value;
    candidature.completed_sections = sections;
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
}

module.exports = new CandidatureService(); 