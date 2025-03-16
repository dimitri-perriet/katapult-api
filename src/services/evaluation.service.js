const db = require('../../models');

const { Op } = require('sequelize');

/**
 * Service de gestion des évaluations
 */
class EvaluationService {
  /**
   * Récupérer toutes les évaluations
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array>} Liste d'évaluations
   */
  async getAllEvaluations(options = {}) {
    const { candidatureId, evaluatorId, status, recommendation, limit, offset, sort } = options;
    
    // Construction des conditions de recherche
    const whereConditions = {};
    
    if (candidatureId) {
      whereConditions.candidature_id = candidatureId;
    }
    
    if (evaluatorId) {
      whereConditions.evaluator_id = evaluatorId;
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (recommendation) {
      whereConditions.recommendation = recommendation;
    }
    
    // Options de requête
    const queryOptions = {
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Candidature,
          as: 'candidature',
          attributes: ['id', 'project_name', 'status']
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
    
    return await Evaluation.findAll(queryOptions);
  }
  
  /**
   * Récupérer une évaluation par son ID
   * @param {number} evaluationId - ID de l'évaluation
   * @returns {Promise<Object>} Évaluation trouvée
   */
  async getEvaluationById(evaluationId) {
    const evaluation = await Evaluation.findByPk(evaluationId, {
      include: [
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Candidature,
          as: 'candidature',
          attributes: ['id', 'project_name', 'status']
        }
      ]
    });
    
    if (!evaluation) {
      throw new Error('Évaluation non trouvée');
    }
    
    return evaluation;
  }
  
  /**
   * Récupérer les évaluations d'une candidature
   * @param {number} candidatureId - ID de la candidature
   * @returns {Promise<Array>} Liste d'évaluations
   */
  async getEvaluationsByCandidature(candidatureId) {
    return await Evaluation.findAll({
      where: { candidature_id: candidatureId },
      include: [
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }
  
  /**
   * Récupérer les évaluations faites par un évaluateur
   * @param {number} evaluatorId - ID de l'évaluateur
   * @returns {Promise<Array>} Liste d'évaluations
   */
  async getEvaluationsByEvaluator(evaluatorId) {
    return await Evaluation.findAll({
      where: { evaluator_id: evaluatorId },
      include: [
        {
          model: Candidature,
          as: 'candidature',
          attributes: ['id', 'project_name', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }
  
  /**
   * Créer une nouvelle évaluation
   * @param {Object} evaluationData - Données de l'évaluation
   * @returns {Promise<Object>} Évaluation créée
   */
  async createEvaluation(evaluationData) {
    // Vérifier si la candidature existe
    const candidature = await Candidature.findByPk(evaluationData.candidatureId);
    if (!candidature) {
      throw new Error('Candidature non trouvée');
    }
    
    // Vérifier si l'évaluateur existe
    const evaluator = await User.findByPk(evaluationData.evaluatorId);
    if (!evaluator) {
      throw new Error('Évaluateur non trouvé');
    }
    
    // Vérifier si l'évaluateur a déjà une évaluation en cours pour cette candidature
    const existingEvaluation = await Evaluation.findOne({
      where: {
        candidature_id: evaluationData.candidatureId,
        evaluator_id: evaluationData.evaluatorId
      }
    });
    
    if (existingEvaluation) {
      throw new Error('Une évaluation existe déjà pour cette candidature et cet évaluateur');
    }
    
    // Créer l'évaluation
    const newEvaluation = await Evaluation.create({
      candidature_id: evaluationData.candidatureId,
      evaluator_id: evaluationData.evaluatorId,
      innovation_score: evaluationData.innovationScore,
      innovation_comment: evaluationData.innovationComment,
      viability_score: evaluationData.viabilityScore,
      viability_comment: evaluationData.viabilityComment,
      impact_score: evaluationData.impactScore,
      impact_comment: evaluationData.impactComment,
      team_score: evaluationData.teamScore,
      team_comment: evaluationData.teamComment,
      alignment_score: evaluationData.alignmentScore,
      alignment_comment: evaluationData.alignmentComment,
      general_comment: evaluationData.generalComment,
      recommendation: evaluationData.recommendation,
      status: evaluationData.status || 'en_cours'
    });
    
    // Si la candidature n'est pas déjà en évaluation, mettre à jour son statut
    if (candidature.status !== 'en_evaluation') {
      await candidature.update({ status: 'en_evaluation' });
    }
    
    return this.getEvaluationById(newEvaluation.id);
  }
  
  /**
   * Mettre à jour une évaluation
   * @param {number} evaluationId - ID de l'évaluation
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Object>} Évaluation mise à jour
   */
  async updateEvaluation(evaluationId, updateData) {
    const evaluation = await Evaluation.findByPk(evaluationId);
    
    if (!evaluation) {
      throw new Error('Évaluation non trouvée');
    }
    
    // Préparer les données à mettre à jour
    const dataToUpdate = {};
    
    if (updateData.innovationScore !== undefined) dataToUpdate.innovation_score = updateData.innovationScore;
    if (updateData.innovationComment !== undefined) dataToUpdate.innovation_comment = updateData.innovationComment;
    if (updateData.viabilityScore !== undefined) dataToUpdate.viability_score = updateData.viabilityScore;
    if (updateData.viabilityComment !== undefined) dataToUpdate.viability_comment = updateData.viabilityComment;
    if (updateData.impactScore !== undefined) dataToUpdate.impact_score = updateData.impactScore;
    if (updateData.impactComment !== undefined) dataToUpdate.impact_comment = updateData.impactComment;
    if (updateData.teamScore !== undefined) dataToUpdate.team_score = updateData.teamScore;
    if (updateData.teamComment !== undefined) dataToUpdate.team_comment = updateData.teamComment;
    if (updateData.alignmentScore !== undefined) dataToUpdate.alignment_score = updateData.alignmentScore;
    if (updateData.alignmentComment !== undefined) dataToUpdate.alignment_comment = updateData.alignmentComment;
    if (updateData.generalComment !== undefined) dataToUpdate.general_comment = updateData.generalComment;
    if (updateData.recommendation !== undefined) dataToUpdate.recommendation = updateData.recommendation;
    if (updateData.status !== undefined) dataToUpdate.status = updateData.status;
    
    // Mise à jour de l'évaluation
    await evaluation.update(dataToUpdate);
    
    return this.getEvaluationById(evaluationId);
  }
  
  /**
   * Finaliser une évaluation
   * @param {number} evaluationId - ID de l'évaluation
   * @returns {Promise<Object>} Évaluation finalisée
   */
  async finalizeEvaluation(evaluationId) {
    const evaluation = await Evaluation.findByPk(evaluationId);
    
    if (!evaluation) {
      throw new Error('Évaluation non trouvée');
    }
    
    if (evaluation.status === 'terminée') {
      throw new Error('Cette évaluation est déjà terminée');
    }
    
    // Vérifier que tous les critères ont été évalués
    const scores = [
      evaluation.innovation_score,
      evaluation.viability_score,
      evaluation.impact_score,
      evaluation.team_score,
      evaluation.alignment_score
    ];
    
    if (scores.some(score => score === undefined || score === null)) {
      throw new Error('Tous les critères doivent être évalués avant de finaliser');
    }
    
    // Mettre à jour le statut de l'évaluation
    await evaluation.update({ status: 'terminée' });
    
    // Récupérer toutes les évaluations terminées pour cette candidature
    const candidatureEvaluations = await Evaluation.findAll({
      where: {
        candidature_id: evaluation.candidature_id,
        status: 'terminée'
      }
    });
    
    // Si toutes les évaluations sont terminées, mettre à jour le statut de la candidature
    const candidature = await Candidature.findByPk(evaluation.candidature_id);
    
    // Logique à adapter selon vos besoins
    if (candidatureEvaluations.length >= 2) {
      // Calculer le nombre de recommandations par type
      const recommendations = candidatureEvaluations.reduce((acc, evalItem) => {
        acc[evalItem.recommendation] = (acc[evalItem.recommendation] || 0) + 1;
        return acc;
      }, {});
      
      // Décider du statut final en fonction des recommandations
      if (recommendations.accepter > recommendations.rejeter) {
        await candidature.update({ status: 'acceptee' });
      } else if (recommendations.rejeter > recommendations.accepter) {
        await candidature.update({ status: 'rejetee' });
      }
    }
    
    return this.getEvaluationById(evaluationId);
  }
  
  /**
   * Supprimer une évaluation
   * @param {number} evaluationId - ID de l'évaluation
   * @returns {Promise<boolean>} Résultat de la suppression
   */
  async deleteEvaluation(evaluationId) {
    const evaluation = await Evaluation.findByPk(evaluationId);
    
    if (!evaluation) {
      throw new Error('Évaluation non trouvée');
    }
    
    await evaluation.destroy();
    return true;
  }
}

module.exports = new EvaluationService(); 