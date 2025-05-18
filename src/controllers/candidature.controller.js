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
    const candidaturesArray = existingCandidatures && Array.isArray(existingCandidatures.candidatures)
      ? existingCandidatures.candidatures
      : (Array.isArray(existingCandidatures) ? existingCandidatures : []);
    
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
      promotion: req.body.promotion || '2025',
      status: 'brouillon',
      phone: req.body.equipe_projet?.reference?.telephone || '',
      
      fiche_identite: req.body.fiche_identite || {},
      projet_utilite_sociale: req.body.projet_utilite_sociale || {},
      qui_est_concerne: req.body.qui_est_concerne || {},
      modele_economique: req.body.modele_economique || {},
      parties_prenantes: req.body.parties_prenantes || {},
      equipe_projet: req.body.equipe_projet || {},
      structure_juridique: req.body.structure_juridique || {},
      etat_avancement: req.body.etat_avancement || {},
      
      documents_json: req.body.documents || { businessPlan: null, financialProjections: null, additionalDocuments: [] },
      
      completion_percentage: req.body.metadata?.completionPercentage || 0,
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
        await mondayService.syncWithMonday.syncCandidature(candidature.id);
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
    
    const existingCandidature = await candidatureService.getCandidatureById(candidatureId);
    
    if (!existingCandidature) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }
    
    const userIsOwner = existingCandidature.user_id === userId;
    const userIsAdmin = req.user.role === 'admin';
    
    if (!userIsOwner && !userIsAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette candidature'
      });
    }
    
    if (['validee', 'rejetee', 'soumise'].includes(existingCandidature.status) && !userIsAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cette candidature ne peut plus être modifiée car elle a déjà été ' + 
          (existingCandidature.status === 'soumise' ? 'soumise' : 'traitée')
      });
    }
    
    const updateData = {};
    let newStatusIsSoumise = false;

    if (req.body.promotion) updateData.promotion = req.body.promotion;
    if (req.body.status && (userIsAdmin || req.body.status === 'soumise')) {
      updateData.status = req.body.status;
      if (req.body.status === 'soumise' && existingCandidature.status !== 'soumise') {
        newStatusIsSoumise = true;
        updateData.submission_date = new Date();
      }
    }
    
    if (req.body.fiche_identite) updateData.fiche_identite = req.body.fiche_identite;
    if (req.body.projet_utilite_sociale) updateData.projet_utilite_sociale = req.body.projet_utilite_sociale;
    if (req.body.qui_est_concerne) updateData.qui_est_concerne = req.body.qui_est_concerne;
    if (req.body.modele_economique) updateData.modele_economique = req.body.modele_economique;
    if (req.body.parties_prenantes) updateData.parties_prenantes = req.body.parties_prenantes;
    if (req.body.equipe_projet) {
      updateData.equipe_projet = req.body.equipe_projet;
      if (req.body.equipe_projet.reference && req.body.equipe_projet.reference.telephone !== undefined) {
        updateData.phone = req.body.equipe_projet.reference.telephone || '';
      }
    }
    if (req.body.structure_juridique) updateData.structure_juridique = req.body.structure_juridique;
    if (req.body.etat_avancement) updateData.etat_avancement = req.body.etat_avancement;
    if (req.body.documents) updateData.documents_json = req.body.documents;
    if (req.body.metadata && req.body.metadata.completionPercentage !== undefined) {
      updateData.completion_percentage = req.body.metadata.completionPercentage;
    }
    if (req.body.metadata && req.body.metadata.lastSaved) {
      try {
        const lastSavedDate = new Date(req.body.metadata.lastSaved);
        if (!isNaN(lastSavedDate.getTime())) {
          updateData.updated_at = lastSavedDate;
        }
      } catch (dateError) {
        console.error(`Erreur lors de la conversion de 'lastSaved': ${dateError}`);
      }
    }
    
    // Première mise à jour (statut, date de soumission, données du formulaire)
    await candidatureService.updateCandidature(candidatureId, updateData);
    
    let pdfGenerationError = null;
    if (newStatusIsSoumise) {
      // Générer le PDF si le statut est passé à 'soumise'
      try {
        console.log(`[updateCandidature] Statut passé à 'soumise'. Appel de exports.generateCandidaturePDF pour ${candidatureId}`);
        await exports.generateCandidaturePDF(candidatureId, userId);
        console.log(`[updateCandidature] PDF généré (ou tentative terminée) pour la candidature ${candidatureId}`);
      } catch (errorGeneratingPdf) {
        pdfGenerationError = errorGeneratingPdf;
        console.error(`[updateCandidature] Erreur lors de la génération auto du PDF pour ${candidatureId}:`, errorGeneratingPdf.message);
      }

      // Synchroniser avec Monday.com si le statut est 'soumise' (ou d'autres statuts pertinents)
      try {
        console.log(`[updateCandidature] Statut 'soumise'. Tentative de synchronisation Monday.com pour ${candidatureId}`);
        await mondayService.syncWithMonday.syncCandidature(candidatureId);
        console.log(`[updateCandidature] Synchronisation Monday.com terminée pour ${candidatureId}`);
      } catch (syncError) {
        console.error(`[updateCandidature] Erreur lors de la synchronisation Monday.com pour ${candidatureId}:`, syncError.message);
      }
      
      // Envoyer une notification à l'utilisateur si le statut est passé à 'soumise'
      try {
        const notificationService = require('../services/notification.service');
        await notificationService.createNotification({
          userId: userId,
          type: 'candidature_soumise', // Ou un type plus générique si la soumission est via update
          message: 'Votre candidature a été soumise avec succès',
          reference: { candidatureId: candidatureId }
        });
        console.log(`[updateCandidature] Notification de soumission envoyée pour ${candidatureId}`);
      } catch (notifError) {
        console.error(`[updateCandidature] Erreur lors de la création de la notification de soumission pour ${candidatureId}:`, notifError.message);
      }
    }
    
    // Récupérer la version la plus à jour de la candidature, incluant potentiellement generated_pdf_url
    const finalCandidature = await candidatureService.getCandidatureById(candidatureId, true);
    
    return res.status(200).json({
      success: true,
      message: 'Candidature mise à jour avec succès' + 
               (newStatusIsSoumise && pdfGenerationError ? '. Le PDF n\'a pas pu être généré automatiquement.' : ''),
      candidature: finalCandidature
    });
  } catch (error) {
    console.error('[updateCandidature] Erreur majeure:', error);
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
    
    const candidatureDetails = await candidatureService.getCandidatureById(candidatureId);
    
    if (!candidatureDetails) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }
    
    if (candidatureDetails.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à soumettre cette candidature"
      });
    }
    
    if (candidatureDetails.status !== 'brouillon') {
      return res.status(400).json({
        success: false,
        message: 'Cette candidature a déjà été soumise ou traitée'
      });
    }
    
    const requiredPercentage = parseInt(process.env.MIN_COMPLETION_PERCENTAGE_SUBMIT) || 90;
    if (!candidatureDetails.completion_percentage || candidatureDetails.completion_percentage < requiredPercentage) {
      return res.status(400).json({
        success: false,
        message: `Vous devez atteindre au moins ${requiredPercentage}% de complétion pour soumettre votre candidature.`,
        completionPercentage: candidatureDetails.completion_percentage || 0
      });
    }
    
    const updateData = {
      status: 'soumise',
      submission_date: new Date()
    };
    
    const updatedCandidatureFromService = await candidatureService.updateCandidature(candidatureId, updateData);

    // Générer le PDF après la soumission réussie
    let pdfGenerationError = null;
    try {
      console.log(`[submitCandidature] Appel de exports.generateCandidaturePDF pour ${candidatureId}`);
      await exports.generateCandidaturePDF(candidatureId, userId); // Appel à la fonction wrapper définie ci-dessus
      console.log(`[submitCandidature] PDF généré (ou tentative terminée) pour la candidature ${candidatureId}`);
    } catch (errorGeneratingPdf) {
      pdfGenerationError = errorGeneratingPdf; // Sauvegarder l'erreur pour la logger plus tard si besoin
      console.error(`[submitCandidature] Erreur lors de la génération automatique du PDF pour la candidature ${candidatureId}:`, errorGeneratingPdf.message);
      // On ne bloque pas la réponse de soumission pour une erreur de PDF
    }
    
    // Synchroniser avec Monday.com
    try {
      await mondayService.syncWithMonday.syncCandidature(candidatureId);
    } catch (syncError) {
      console.error('[submitCandidature] Erreur lors de la synchronisation avec Monday.com:', syncError.message);
      // On continue même si la synchronisation échoue
    }
    
    // Envoyer une notification à l'utilisateur
    try {
      const notificationService = require('../services/notification.service'); // require ici pour éviter dépendance cyclique potentielle
      await notificationService.createNotification({
        userId: userId,
        type: 'candidature_soumise',
        message: 'Votre candidature a été soumise avec succès',
        reference: {
          candidatureId: candidatureId
        }
      });
    } catch (notifError) {
      console.error('[submitCandidature] Erreur lors de la création de la notification:', notifError.message);
    }
    
    // Récupérer la version la plus à jour de la candidature, incluant potentiellement generated_pdf_url
    const finalCandidature = await candidatureService.getCandidatureById(candidatureId, true);

    return res.status(200).json({
      success: true,
      message: 'Candidature soumise avec succès' + (pdfGenerationError ? '. Le PDF n\'a pas pu être généré automatiquement.' : ''),
      candidature: finalCandidature // Renvoyer la version la plus à jour
    });
  } catch (error) {
    console.error('[submitCandidature] Erreur lors de la soumission de la candidature:', error);
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
      completionPercentage: candidature.completion_percentage || 0
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
    const formattedCandidatures = candidatures.map(c => {
      // Extraction du nom du projet et du secteur depuis fiche_identite
      let projectName = c.project_name;
      let sector = c.sector;
      
      // Si ces champs ne sont pas directement disponibles, on essaie de les extraire de fiche_identite
      if ((!projectName || projectName === 'Sans nom') && c.fiche_identite) {
        try {
          // La fiche d'identité peut être soit un objet soit une chaîne JSON
          const ficheIdentite = typeof c.fiche_identite === 'string' 
            ? JSON.parse(c.fiche_identite) 
            : c.fiche_identite;
            
          // Extraire le nom du projet et le secteur
          if (ficheIdentite.projectName) {
            projectName = ficheIdentite.projectName;
          }
          
          if (ficheIdentite.sector) {
            sector = ficheIdentite.sector;
          }
        } catch (e) {
          console.error('Erreur lors du parsing de fiche_identite:', e);
        }
      }
      
      return {
        id: c.id,
        projectName: projectName || 'Sans nom',
        sector: sector || 'Non spécifié',
        status: c.status,
        promotion: c.promotion || 'Non spécifiée',
        applicant: c.user ? `${c.user.first_name} ${c.user.last_name}` : 'Inconnu',
        email: c.user ? c.user.email : '',
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        submissionDate: c.submission_date,
        completionPercentage: c.completion_percentage || 0
      };
    });
    
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

// Fonction wrapper pour la génération de PDF
exports.generateCandidaturePDF = async (candidatureId, userIdMakingRequest) => {
  try {
    console.log(`[PDF Controller] Début de la génération PDF pour la candidature ${candidatureId}`);
    
    // Récupérer toutes les données de la candidature, y compris les associations
    const candidature = await candidatureService.getCandidatureById(candidatureId, true); 
    
    if (!candidature) {
      console.error(`[PDF Controller] Candidature ${candidatureId} non trouvée pour la génération du PDF.`);
      // Ne pas throw ici pour permettre au flux principal de continuer, mais l'erreur est loggée.
      // Le service pdf-generator lui-même pourrait aussi gérer le cas d'une candidature null.
      return null; 
    }

    // Optionnel : Vérification des droits (peut être déjà fait en amont)
    // if (candidature.user_id !== userIdMakingRequest && !isUserAdmin(userIdMakingRequest)) { // isUserAdmin serait une fonction à implémenter
    //   console.warn(`[PDF Controller] Tentative non autorisée de génération de PDF pour la candidature ${candidatureId} par l'utilisateur ${userIdMakingRequest}`);
    //   return null;
    // }
    
    // Appel à la fonction generatePDF du module pdf-generator
    // Cette fonction generatePDF (dans pdf-generator.js) est maintenant responsable 
    // de la création du fichier ET de la mise à jour de la BDD avec generated_pdf_url.
    const pdfPath = await generatePDF(candidature); 
    
    console.log(`[PDF Controller] PDF pour la candidature ${candidatureId} traité par pdf-generator. Chemin retourné: ${pdfPath}`);
    return pdfPath; // Le chemin est retourné mais le contrôleur principal ne l'utilise pas directement.

  } catch (error) {
    console.error(`[PDF Controller] Erreur majeure dans generateCandidaturePDF pour la candidature ${candidatureId}:`, error);
    // Il est important que cette erreur soit propagée ou gérée pour que le try/catch dans submitCandidature la voie
    throw error; 
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
    
    // Utiliser directement le service Monday avec la bonne structure
    return await mondayService.syncWithMonday.syncCandidature(candidatureId);
    
  } catch (error) {
    throw new Error(`Erreur lors de la synchronisation avec Monday.com : ${error.message}`);
  }
};