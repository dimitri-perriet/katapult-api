const { generatePDF } = require('../utils/pdf-generator');
const { 
  sendReminderEmail, 
  sendSubmissionConfirmationEmail,
  sendDecisionEmail
} = require('../utils/email');
const candidatureService = require('../services/candidature.service');
const userService = require('../services/user.service');
const evaluationService = require('../services/evaluation.service');
const mondayService = require('../services/monday.service');

// Créer une nouvelle candidature
exports.createCandidature = async (req, res) => {
  try {
    const userId = req.user.id;

    // Vérifier si l'utilisateur a déjà une candidature active
    const existingCandidatures = await candidatureService.getAllCandidatures({
      userId,
      page: 1,
      limit: 100
    });
    
    // Vérifier la structure des données retournées pour éviter l'erreur "Cannot read properties of undefined"
    const candidaturesArray = Array.isArray(existingCandidatures) 
      ? existingCandidatures 
      : (existingCandidatures.candidatures || []);
    
    const activeCandidature = candidaturesArray.find(c => 
      c.status !== 'rejetee'
    );
    
    if (activeCandidature) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà une candidature active. Vous ne pouvez pas en créer une nouvelle.',
        candidatureId: activeCandidature.id
      });
    }
    
    // Définir la structure par défaut pour une nouvelle candidature
    const candidatureData = {
      promotion: req.body.promotion || 'Katapult 2023',
      status: 'brouillon',
      // Définir explicitement phone comme un champ de premier niveau avec une valeur par défaut
      phone: req.body.phone || req.body.equipe_projet?.reference?.telephone || '',
      
      // Utiliser directement les sections de req.body si elles existent, sinon utiliser des objets vides
      fiche_identite: req.body.fiche_identite || {
        callSource: '',
        callSourceOther: '',
        phone: '',
        street: '',
        city: '',
        postalCode: '',
        country: 'France',
        currentSituation: '',
        currentSituationOther: '',
        projectName: '',
        projectDescription: '',
      },
      
      projet_utilite_sociale: req.body.projet_utilite_sociale || {
        sector: '',
        sectorOther: '',
        maturityLevel: '',
        startDate: null,
        implementationArea: '',
        interventionArea: '',
        problemStatement: '',
        solutionDescription: '',
      },
      
      qui_est_concerne: req.body.qui_est_concerne || {
        beneficiaries: [],
        targetGroups: [],
        impactDescription: '',
        measurableImpacts: []
      },
      
      modele_economique: req.body.modele_economique || {
        economicModel: '',
        revenueStructure: [],
        fundingSources: [],
        financialProjections: {
          year1: { revenues: 0, expenses: 0, result: 0 },
          year2: { revenues: 0, expenses: 0, result: 0 },
          year3: { revenues: 0, expenses: 0, result: 0 }
        }
      },
      
      parties_prenantes: req.body.parties_prenantes || {
        partners: [],
        competitors: [],
        stakeholders: []
      },
      
      equipe_projet: req.body.equipe_projet || {
        members: []
      },
      
      structure_juridique: req.body.structure_juridique || {
        hasExistingStructure: false,
        structureName: '',
        structureStatus: '',
        structureCreationDate: '',
        structureContext: ''
      },
      
      documents_json: req.body.documents_json || [],
      
      completed_sections: req.body.completed_sections || {
        ficheIdentite: false,
        projetUtiliteSociale: false,
        quiEstConcerne: false,
        modeleEconomique: false,
        partiesPrenantes: false,
        equipeProjet: false,
        documents: false
      }
    };
    
    // Assurer que phone est toujours une chaîne et jamais null ou undefined
    if (candidatureData.phone === null || candidatureData.phone === undefined) {
      candidatureData.phone = '';
    }
    
    console.log("______")
    console.log(candidatureData)
    // Créer la candidature en utilisant le service
    const candidature = await candidatureService.createCandidature(candidatureData, userId);
    
    // Synchroniser avec Monday.com (optionnel)
    try {
      if (candidature && candidature.id) {
        await mondayService.syncCandidature(candidature.id);
      }
    } catch (syncError) {
      console.error('Erreur lors de la synchronisation avec Monday.com:', syncError);
      // On ne renvoie pas d'erreur même si la synchronisation échoue
    }
    
    return res.status(201).json({
      success: true,
      message: 'Candidature créée avec succès',
      candidature
    });
  } catch (error) {
    console.error('Erreur lors de la création de la candidature:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la candidature',
      error: error.message
    });
  }
};

/**
 * Mettre à jour une candidature
 * @param {Request} req - Requête HTTP
 * @param {Response} res - Réponse HTTP
 * @returns {Promise<void>}
 */
exports.updateCandidature = async (req, res) => {
  try {
    const candidatureId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    
    // Récupérer la candidature existante
    const existingCandidature = await candidatureService.getCandidatureById(candidatureId);
    
    if (!existingCandidature) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }
    
    // Vérifier les autorisations
    const userIsOwner = existingCandidature.user_id === userId;
    const userIsAdmin = req.user.role === 'admin';
    
    if (!userIsOwner && !userIsAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette candidature'
      });
    }
    
    // Vérifier si la candidature est au statut "validee", "rejetee" ou "soumise" (pour les non-admin)
    if (['validee', 'rejetee', 'soumise'].includes(existingCandidature.status) && !userIsAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cette candidature ne peut plus être modifiée car elle a déjà été ' + 
          (existingCandidature.status === 'soumise' ? 'soumise' : 'traitée')
      });
    }
    
    // Préparer les données à mettre à jour
    const updateData = {};
    
    // Mise à jour des champs simples
    if (req.body.promotion) updateData.promotion = req.body.promotion;
    if (req.body.status && (userIsAdmin || req.body.status === 'soumise')) updateData.status = req.body.status;
    
    // Si le statut passe à "soumise", mettre à jour la date de soumission
    if (req.body.status === 'soumise' && existingCandidature.status !== 'soumise') {
      updateData.submission_date = new Date();
    }
    
    // Mise à jour des sections JSON
    if (req.body.fiche_identite) {
      updateData.fiche_identite = req.body.fiche_identite;
    }
    
    if (req.body.projet_utilite_sociale) {
      updateData.projet_utilite_sociale = req.body.projet_utilite_sociale;
    }
    
    if (req.body.qui_est_concerne) {
      updateData.qui_est_concerne = req.body.qui_est_concerne;
    }
    
    if (req.body.modele_economique) {
      updateData.modele_economique = req.body.modele_economique;
    }
    
    if (req.body.parties_prenantes) {
      updateData.parties_prenantes = req.body.parties_prenantes;
    }
    
    if (req.body.equipe_projet) {
      updateData.equipe_projet = req.body.equipe_projet;
    }
    
    // Mise à jour des sections complétées
    if (req.body.completed_sections) {
      updateData.completed_sections = req.body.completed_sections;
    }
    
    // Effectuer la mise à jour via le service
    const updatedCandidature = await candidatureService.updateCandidature(candidatureId, updateData);
    
    // Synchroniser avec Monday.com si nécessaire
    if (['soumise', 'en_cours_evaluation', 'validee', 'rejetee'].includes(updatedCandidature.status)) {
      try {
        await mondayService.syncCandidature(candidatureId);
      } catch (syncError) {
        console.error('Erreur lors de la synchronisation avec Monday.com:', syncError);
        // On continue même si la synchronisation échoue
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Candidature mise à jour avec succès',
      candidature: updatedCandidature
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la candidature:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la candidature',
      error: error.message
    });
  }
};

/**
 * Soumettre une candidature
 * @param {Request} req - Requête HTTP
 * @param {Response} res - Réponse HTTP
 * @returns {Promise<void>}
 */
exports.submitCandidature = async (req, res) => {
  try {
    const candidatureId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    
    // Récupérer la candidature
    const candidature = await candidatureService.getCandidatureById(candidatureId);
    
    if (!candidature) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }
    
    // Vérifier si l'utilisateur est le propriétaire
    if (candidature.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à soumettre cette candidature'
      });
    }
    
    // Vérifier si la candidature est au statut brouillon
    if (candidature.status !== 'brouillon') {
      return res.status(400).json({
        success: false,
        message: 'Cette candidature a déjà été soumise ou traitée'
      });
    }
    
    // Vérifier si toutes les sections sont complétées
    const completed = candidature.completed_sections;
    const allSectionsCompleted = 
      completed.ficheIdentite && 
      completed.projetUtiliteSociale && 
      completed.quiEstConcerne && 
      completed.modeleEconomique && 
      completed.partiesPrenantes && 
      completed.equipeProjet;
    
    if (!allSectionsCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez compléter toutes les sections avant de soumettre votre candidature',
        completed
      });
    }
    
    // Mettre à jour le statut et la date de soumission
    const updateData = {
      status: 'soumise',
      submission_date: new Date()
    };
    
    // Effectuer la mise à jour
    const updatedCandidature = await candidatureService.updateCandidature(candidatureId, updateData);
    
    // Synchroniser avec Monday.com
    try {
      await mondayService.syncCandidature(candidatureId);
    } catch (syncError) {
      console.error('Erreur lors de la synchronisation avec Monday.com:', syncError);
      // On continue même si la synchronisation échoue
    }
    
    // Envoyer une notification à l'utilisateur
    try {
      const notificationService = require('../services/notification.service');
      await notificationService.createNotification({
        userId: userId,
        type: 'candidature_soumise',
        message: 'Votre candidature a été soumise avec succès',
        reference: {
          candidatureId: candidatureId
        }
      });
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // On continue même si la notification échoue
    }
    
    return res.status(200).json({
      success: true,
      message: 'Candidature soumise avec succès',
      candidature: updatedCandidature
    });
  } catch (error) {
    console.error('Erreur lors de la soumission de la candidature:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission de la candidature',
      error: error.message
    });
  }
};

/**
 * Récupérer une candidature par son ID
 * @param {Request} req - Requête HTTP
 * @param {Response} res - Réponse HTTP
 * @returns {Promise<void>}
 */
exports.getCandidature = async (req, res) => {
  try {
    const candidatureId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    
    // Récupérer la candidature
    const candidature = await candidatureService.getCandidatureById(candidatureId, true);
    
    if (!candidature) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }
    
    // Vérifier les autorisations
    const userIsOwner = candidature.user_id === userId;
    const userIsAdmin = req.user.role === 'admin';
    const userIsEvaluator = req.user.role === 'evaluateur';
    
    // Vérifier si l'utilisateur a accès à cette candidature
    let hasAccess = userIsOwner || userIsAdmin;
    
    // Si l'utilisateur est évaluateur, vérifier s'il a accès à cette candidature
    if (!hasAccess && userIsEvaluator) {
      const candidatureAccessService = require('../services/candidatureAccess.service');
      hasAccess = await candidatureAccessService.hasAccess(candidatureId, userId);
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à accéder à cette candidature'
      });
    }
    
    // Si tout est OK, renvoyer la candidature
    return res.status(200).json({
      success: true,
      candidature,
      isOwner: userIsOwner,
      isAdmin: userIsAdmin,
      isEvaluator: userIsEvaluator,
      completionPercentage: candidature.getCompletionPercentage ? candidature.getCompletionPercentage() : 0
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la candidature:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la candidature',
      error: error.message
    });
  }
};

// Récupérer toutes les candidatures
exports.getAllCandidatures = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Options de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Options de filtrage
    const options = {
      limit,
      offset,
      sort: req.query.sort || 'created_at:DESC'
    };
    
    // Les candidats ne peuvent voir que leurs propres candidatures
    if (req.user.role === 'candidat') {
      options.userId = userId;
    }
    
    // Filtrer par statut si spécifié
    if (req.query.status) {
      options.status = req.query.status;
    }
    
    // Filtrer par promotion si spécifié
    if (req.query.promotion) {
      options.promotion = req.query.promotion;
    }
    
    // Filtrer par secteur si spécifié
    if (req.query.sector) {
      options.sector = req.query.sector;
    }
    
    // Recherche par terme si spécifié
    if (req.query.search) {
      options.search = req.query.search;
    }
    
    // Utiliser le service
    const candidatures = await candidatureService.getAllCandidatures(options);
    
    // Formater les données pour l'affichage
    const formattedCandidatures = candidatures.map(c => ({
      id: c.id,
      projectName: c.project_name || 'Sans nom',
      sector: c.sector || 'Non spécifié',
      status: c.status,
      promotion: c.promotion || 'Non spécifiée',
      applicant: c.user ? `${c.user.first_name} ${c.user.last_name}` : 'Inconnu',
      email: c.user ? c.user.email : '',
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      submissionDate: c.submission_date
    }));
    
    // Compter le nombre total pour la pagination
    const totalOptions = { ...options };
    delete totalOptions.limit;
    delete totalOptions.offset;
    const totalCandidatures = await candidatureService.getAllCandidatures(totalOptions);
    
    res.status(200).json({
      success: true,
      count: candidatures.length,
      total: totalCandidatures.length,
      totalPages: Math.ceil(totalCandidatures.length / limit),
      currentPage: page,
      candidatures: formattedCandidatures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des candidatures',
      error: error.message
    });
  }
};

// Récupérer les statistiques des candidatures
exports.getCandidatureStats = async (req, res) => {
  try {
    // Utiliser les services pour récupérer les statistiques
    const stats = await candidatureService.getStatistics();
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};

// Ajouter une note interne
exports.addInternalNote = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { content } = req.body;
    
    // Récupérer la candidature via le service
    const candidature = await candidatureService.getCandidatureById(id);
    
    if (!candidature) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée',
      });
    }
    
    // Ajouter la note interne via un service
    // TODO: Créer une fonction dans le service pour ajouter des notes
    // Pour l'instant, on simule la réponse
    const note = {
      author: userId,
      content,
      date: new Date()
    };
    
    res.status(200).json({
      success: true,
      message: 'Note ajoutée avec succès',
      note
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la note',
      error: error.message,
    });
  }
};

// Programmer une relance
exports.scheduleReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, date } = req.body;
    
    // Récupérer la candidature via le service
    const candidature = await candidatureService.getCandidatureById(parseInt(id, 10), true);
    
    if (!candidature) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée',
      });
    }
    
    // Créer une relance
    // Note: Si votre service n'a pas de fonction pour les relances, il faudra l'ajouter
    const reminderData = {
      type: 'manuel',
      date: new Date(date),
      status: 'planifiée',
      message,
    };
    
    // Mise à jour pour ajouter la relance (dépend de votre implémentation)
    // Ici, utiliser un service dédié aux relances ou étendre le service de candidature
    
    // Si la date est aujourd'hui ou passée, envoyer la relance immédiatement
    const today = new Date();
    const reminderDate = new Date(date);
    
    if (reminderDate <= today) {
      await sendReminderEmail(
        candidature.user.email,
        candidature.user.first_name,
        candidature.fiche_identite?.projectName || 'Projet'
      );
      
      // Mettre à jour le statut de la relance
      reminderData.status = 'envoyée';
    }
    
    res.status(200).json({
      success: true,
      message: 'Relance programmée avec succès',
      reminder: reminderData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la programmation de la relance',
      error: error.message,
    });
  }
};

// Ajouter un document à une candidature
exports.addDocumentToCandidature = async (candidatureId, fileDetails, userId) => {
  try {
    // Récupérer la candidature en utilisant le service
    const candidature = await candidatureService.getCandidatureById(candidatureId);
    
    if (!candidature) {
      throw new Error('Candidature non trouvée');
    }
    
    // Vérifier si l'utilisateur est le propriétaire ou un admin
    const userIsOwner = candidature.user_id === userId;
    
    if (!userIsOwner) {
      const userService = require('../services/user.service');
      const user = await userService.getUserById(userId);
      if (user.role !== 'admin') {
        throw new Error('Vous n\'êtes pas autorisé à ajouter des documents à cette candidature');
      }
    }
    
    // Vérifier si la candidature peut être modifiée
    if (candidature.status !== 'brouillon') {
      if (candidature.status === 'soumise') {
        // Pour les candidatures soumises, seuls les administrateurs peuvent ajouter des documents
        const userService = require('../services/user.service');
        const user = await userService.getUserById(userId);
        if (user.role !== 'admin') {
          throw new Error('Cette candidature ne peut plus être modifiée car elle a déjà été soumise');
        }
      } else {
        // Pour les autres statuts (validée, rejetée, etc.), personne ne peut modifier
        throw new Error('Cette candidature ne peut plus être modifiée');
      }
    }
    
    // Ajouter le document à la candidature via le service
    await candidatureService.addDocument(candidatureId, fileDetails);
    
    // Récupérer la candidature mise à jour
    return await candidatureService.getCandidatureById(candidatureId);
  } catch (error) {
    throw new Error(`Erreur lors de l'ajout du document : ${error.message}`);
  }
};

// Générer un PDF à partir d'une candidature
exports.generateCandidaturePDF = async (candidatureId, userId) => {
  try {
    // Récupérer la candidature avec les détails de l'utilisateur via le service
    const candidature = await candidatureService.getCandidatureById(parseInt(candidatureId, 10), true);
    
    if (!candidature) {
      throw new Error('Candidature non trouvée');
    }
    
    // Vérifier les permissions
    const isOwner = candidature.user_id === userId;
    
    // Récupérer l'utilisateur via le service
    const userService = require('../services/user.service');
    const user = await userService.getUserById(userId);
    const isAdminOrEvaluator = ['admin', 'evaluateur'].includes(user.role);
    
    if (!isOwner && !isAdminOrEvaluator) {
      throw new Error('Vous n\'êtes pas autorisé à générer un PDF pour cette candidature');
    }
    
    // Générer le PDF
    const pdfPath = await generatePDF(candidature);
    
    // Si c'est généré automatiquement par le système, mettre à jour l'URL du PDF
    if (!candidature.generated_pdf_url) {
      await candidatureService.updateCandidature(candidatureId, {
        generated_pdf_url: pdfPath
      });
    }
    
    return pdfPath;
  } catch (error) {
    throw new Error(`Erreur lors de la génération du PDF : ${error.message}`);
  }
};

// Synchroniser une candidature avec Monday.com
exports.syncWithMonday = async (candidatureId) => {
  try {
    // Récupérer la candidature via le service
    const candidature = await candidatureService.getCandidatureById(parseInt(candidatureId, 10), true);
    
    if (!candidature) {
      throw new Error('Candidature non trouvée');
    }
    
    // Synchroniser avec Monday.com
    let result;
    
    // Si la candidature a déjà un ID Monday, mettre à jour l'item
    if (candidature.monday_item_id) {
      result = await mondayService.updateItem(candidature);
    } else {
      // Sinon, créer un nouvel item
      const mondayItemId = await mondayService.createItem(candidature);
      
      // Mettre à jour la candidature avec l'ID Monday via le service
      await candidatureService.updateCandidature(candidatureId, {
        monday_item_id: mondayItemId
      });
      
      result = { mondayItemId };
    }
    
    return result;
  } catch (error) {
    throw new Error(`Erreur lors de la synchronisation avec Monday.com : ${error.message}`);
  }
}; 