const evaluationService = require('../services/evaluation.service');
const candidatureService = require('../services/candidature.service');
const userService = require('../services/user.service');
const mondayService = require('../services/monday.service');

// Créer ou mettre à jour une évaluation
exports.createOrUpdateEvaluation = async (req, res) => {
  try {
    const candidatureId = parseInt(req.params.candidatureId, 10);
    const userId = req.user.id;
    const evaluationData = req.body;
    
    // Vérifier si l'utilisateur est un évaluateur ou admin
    const user = await userService.getUserById(userId);
    if (!['evaluateur', 'admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à évaluer les candidatures',
      });
    }
    
    // Vérifier si la candidature existe et est évaluable
    const candidature = await candidatureService.getCandidatureById(candidatureId);
    if (!candidature) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée',
      });
    }
    
    // Vérifier si la candidature est au statut approprié
    if (!['soumise', 'en_cours_d_evaluation', 'présélectionnée'].includes(candidature.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cette candidature ne peut pas être évaluée dans son état actuel',
      });
    }
    
    // Vérifier si l'évaluateur a déjà une évaluation pour cette candidature
    const existingEvaluations = await evaluationService.getEvaluationsByCandidature(candidatureId);
    let evaluation = existingEvaluations.find(eval => eval.evaluator_id === userId);
    
    // Si l'évaluation existe, la mettre à jour, sinon en créer une nouvelle
    if (evaluation) {
      // Mise à jour de l'évaluation existante
      const updateData = {
        criteria: evaluationData.criteria,
        general_comment: evaluationData.generalComment,
        recommendation: evaluationData.recommendation,
        status: evaluationData.status || 'en_cours'
      };
      
      evaluation = await evaluationService.updateEvaluation(evaluation.id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Évaluation mise à jour avec succès',
        evaluation,
      });
    } else {
      // Création d'une nouvelle évaluation
      const newEvaluationData = {
        candidature_id: candidatureId,
        evaluator_id: userId,
        criteria: evaluationData.criteria,
        general_comment: evaluationData.generalComment,
        recommendation: evaluationData.recommendation,
        status: evaluationData.status || 'en_cours',
      };
      
      const savedEvaluation = await evaluationService.createEvaluation(newEvaluationData);
      
      // Mettre à jour le statut de la candidature si ce n'est pas déjà le cas
      if (candidature.status === 'soumise') {
        await candidatureService.updateCandidature(candidatureId, {
          status: 'en_cours_d_evaluation',
          evaluation_date: new Date()
        });
        
        // Synchroniser avec Monday.com
        try {
          await mondayService.updateItemStatus(candidatureId, 'en_cours_d_evaluation');
        } catch (error) {
          console.error('Erreur de synchronisation avec Monday:', error);
        }
      }
      
      res.status(201).json({
        success: true,
        message: 'Évaluation créée avec succès',
        evaluation: savedEvaluation,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création/mise à jour de l\'évaluation',
      error: error.message,
    });
  }
};

// Finaliser une évaluation
exports.finalizeEvaluation = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user.id;
    
    // Trouver l'évaluation
    const evaluation = await evaluationService.getEvaluationById(id);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Évaluation non trouvée',
      });
    }
    
    // Vérifier si l'utilisateur est l'évaluateur ou un admin
    if (evaluation.evaluator_id !== userId) {
      const user = await userService.getUserById(userId);
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas autorisé à finaliser cette évaluation',
        });
      }
    }
    
    // Vérifier si tous les critères sont remplis
    const criteria = evaluation.criteria;
    const isComplete = criteria && Object.keys(criteria).every(key => 
      criteria[key] && typeof criteria[key].score === 'number'
    );
    
    if (!isComplete) {
      return res.status(400).json({
        success: false,
        message: 'Tous les critères doivent être évalués avant de finaliser',
      });
    }
    
    // Finaliser l'évaluation
    const finalizedEvaluation = await evaluationService.finalizeEvaluation(id);
    
    // Calculer le score
    const totalScore = {
      points: Object.values(criteria).reduce((sum, c) => sum + c.score, 0),
      maxPoints: Object.keys(criteria).length * 5,
      percentage: Math.round((Object.values(criteria).reduce((sum, c) => sum + c.score, 0) / (Object.keys(criteria).length * 5)) * 100)
    };
    
    // Récupérer la candidature associée
    const candidature = await candidatureService.getCandidatureById(evaluation.candidature_id);
    
    // Signaler à Monday.com qu'une évaluation a été finalisée
    try {
      await mondayService.updateEvaluationStatus(candidature.id, totalScore.percentage);
    } catch (error) {
      console.error('Erreur de synchronisation avec Monday:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Évaluation finalisée avec succès',
      evaluation: finalizedEvaluation,
      score: totalScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la finalisation de l\'évaluation',
      error: error.message,
    });
  }
};

// Récupérer toutes les évaluations d'une candidature
exports.getEvaluationsByCandidature = async (req, res) => {
  try {
    const candidatureId = parseInt(req.params.candidatureId, 10);
    const userId = req.user.id;
    
    // Vérifier si l'utilisateur est autorisé (admin)
    const user = await userService.getUserById(userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à voir toutes les évaluations',
      });
    }
    
    // Récupérer les évaluations
    const evaluations = await evaluationService.getEvaluationsByCandidature(candidatureId);
    
    // Calculer le score moyen (si des évaluations existent)
    let averageScore = null;
    if (evaluations.length > 0) {
      const totalPoints = evaluations.reduce((sum, eval) => {
        if (eval.criteria) {
          return sum + Object.values(eval.criteria).reduce((criteriaSum, c) => criteriaSum + (c.score || 0), 0);
        }
        return sum;
      }, 0);
      
      const maxPoints = evaluations.length * 5 * 5; // 5 critères * score max de 5 * nombre d'évaluations
      averageScore = {
        points: totalPoints,
        maxPoints: maxPoints,
        percentage: Math.round((totalPoints / maxPoints) * 100)
      };
    }
    
    res.status(200).json({
      success: true,
      count: evaluations.length,
      evaluations,
      averageScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des évaluations',
      error: error.message,
    });
  }
};

// Récupérer une évaluation spécifique
exports.getEvaluation = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user.id;
    
    // Trouver l'évaluation
    const evaluation = await evaluationService.getEvaluationById(id);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Évaluation non trouvée',
      });
    }
    
    // Vérifier les permissions (évaluateur lui-même ou admin)
    const user = await userService.getUserById(userId);
    const isOwner = evaluation.evaluator_id === userId;
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à accéder à cette évaluation',
      });
    }
    
    // Calculer le score
    let score = null;
    if (evaluation.criteria) {
      const points = Object.values(evaluation.criteria).reduce((sum, c) => sum + (c.score || 0), 0);
      const maxPoints = Object.keys(evaluation.criteria).length * 5;
      score = {
        points: points,
        maxPoints: maxPoints,
        percentage: Math.round((points / maxPoints) * 100)
      };
    }
    
    res.status(200).json({
      success: true,
      evaluation,
      score
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'évaluation',
      error: error.message,
    });
  }
};

// Récupérer toutes les évaluations assignées à un évaluateur
exports.getEvaluatorAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Vérifier si l'utilisateur est un évaluateur ou admin
    const user = await userService.getUserById(userId);
    if (!['evaluateur', 'admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à accéder aux évaluations',
      });
    }
    
    // Options de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Options de filtrage
    const options = {
      limit,
      page,
      status: req.query.status || null
    };
    
    // Pour les admins, récupérer toutes les évaluations, sinon filtrer par évaluateur
    if (user.role !== 'admin') {
      options.evaluatorId = userId;
    }
    
    // Récupérer les évaluations via le service
    const result = await evaluationService.getAllEvaluations(options);
    
    res.status(200).json({
      success: true,
      count: result.evaluations.length,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
      evaluations: result.evaluations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des assignations',
      error: error.message,
    });
  }
};

// Décision de présélection (admin uniquement)
exports.preSelectCandidature = async (req, res) => {
  try {
    const candidatureId = parseInt(req.params.candidatureId, 10);
    const userId = req.user.id;
    const { isPreSelected, comments } = req.body;
    
    // Vérifier si l'utilisateur est un admin
    const user = await userService.getUserById(userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent présélectionner les candidatures',
      });
    }
    
    // Récupérer la candidature
    const candidature = await candidatureService.getCandidatureById(candidatureId);
    
    if (!candidature) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée',
      });
    }
    
    // Vérifier si la candidature est évaluable
    if (!['en_cours_d_evaluation', 'soumise'].includes(candidature.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cette candidature ne peut pas être présélectionnée dans son état actuel',
      });
    }
    
    // Mettre à jour le statut
    let updatedCandidature;
    if (isPreSelected) {
      // Si présélectionnée
      const updateData = {
        status: 'présélectionnée'
      };
      
      // Ajouter un commentaire interne si fourni
      if (comments) {
        // Note: Vous devrez implémenter un service pour ajouter des notes
        console.log(`Présélection (${candidatureId}): ${comments}`);
      }
      
      updatedCandidature = await candidatureService.updateCandidature(candidatureId, updateData);
      
      // Synchroniser avec Monday.com
      try {
        await mondayService.updateItemStatus(candidatureId, 'présélectionnée');
      } catch (error) {
        console.error('Erreur de synchronisation avec Monday:', error);
      }
      
      res.status(200).json({
        success: true,
        message: 'Candidature présélectionnée avec succès',
        candidature: updatedCandidature,
      });
    } else {
      // Si non présélectionnée, retourner au statut soumis ou maintenir en évaluation
      const updateData = {
        status: 'en_cours_d_evaluation'
      };
      
      // Ajouter un commentaire interne si fourni
      if (comments) {
        // Note: Vous devrez implémenter un service pour ajouter des notes
        console.log(`Non présélectionnée (${candidatureId}): ${comments}`);
      }
      
      updatedCandidature = await candidatureService.updateCandidature(candidatureId, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Candidature maintenue en évaluation',
        candidature: updatedCandidature,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la présélection',
      error: error.message,
    });
  }
};

// Décision finale (admin uniquement)
exports.finalDecision = async (req, res) => {
  try {
    const candidatureId = parseInt(req.params.candidatureId, 10);
    const userId = req.user.id;
    const { decision, comments } = req.body;
    
    // Vérifier si l'utilisateur est un admin
    const user = await userService.getUserById(userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent prendre la décision finale',
      });
    }
    
    // Vérifier si la décision est valide
    if (!['acceptée', 'non_retenue'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Décision invalide, doit être "acceptée" ou "non retenue"',
      });
    }
    
    // Récupérer la candidature
    const candidature = await candidatureService.getCandidatureById(candidatureId);
    
    if (!candidature) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée',
      });
    }
    
    // Vérifier si la candidature est en état d'être décidée
    if (candidature.status !== 'présélectionnée' && candidature.status !== 'en_cours_d_evaluation') {
      return res.status(400).json({
        success: false,
        message: 'Cette candidature n\'est pas en état d\'être décidée',
      });
    }
    
    // Mettre à jour le statut
    const updateData = {
      status: decision,
      decision_date: new Date()
    };
    
    // Ajouter un commentaire interne si fourni
    if (comments) {
      // Note: Vous devrez implémenter un service pour ajouter des notes
      console.log(`Décision finale (${candidatureId} - ${decision}): ${comments}`);
    }
    
    const updatedCandidature = await candidatureService.updateCandidature(candidatureId, updateData);
    
    // Synchroniser avec Monday.com
    try {
      await mondayService.updateItemStatus(candidatureId, decision);
    } catch (error) {
      console.error('Erreur de synchronisation avec Monday:', error);
    }
    
    res.status(200).json({
      success: true,
      message: `Candidature ${decision} avec succès`,
      candidature: updatedCandidature,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la décision finale',
      error: error.message,
    });
  }
}; 