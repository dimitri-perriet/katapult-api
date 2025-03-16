const candidatureService = require('../services/candidature.service');
const mondayService = require('../services/monday.service');

// Synchroniser une candidature avec Monday
exports.syncCandidature = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    // Vérifier si la candidature existe
    const candidature = await candidatureService.getCandidatureById(id);
    
    if (!candidature) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée',
      });
    }
    
    // Si la candidature n'a pas d'ID Monday, en créer un
    if (!candidature.monday_item_id) {
      const mondayItemId = await mondayService.createItem(candidature);
      
      if (!mondayItemId) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de l\'item Monday',
        });
      }
      
      // Mettre à jour la candidature avec l'ID Monday
      await candidatureService.updateCandidature(id, { monday_item_id: mondayItemId });
      
      return res.status(200).json({
        success: true,
        message: 'Item Monday créé avec succès',
        mondayItemId,
      });
    }
    
    // Sinon, mettre à jour l'item existant
    const updated = await mondayService.updateItem(candidature);
    
    if (!updated) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'item Monday',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Synchronisation réussie avec Monday',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation avec Monday',
      error: error.message,
    });
  }
};

// Synchroniser toutes les candidatures avec Monday
exports.syncAllCandidatures = async (req, res) => {
  try {
    // Récupérer toutes les candidatures avec le service candidature
    const result = await candidatureService.getAllCandidatures({});
    const candidatures = Array.isArray(result) ? result : (result.candidatures || []);
    
    // Résultats de synchronisation
    const results = {
      total: candidatures.length,
      success: 0,
      failures: 0,
      details: [],
    };
    
    // Traiter chaque candidature
    for (const candidature of candidatures) {
      try {
        if (!candidature.monday_item_id) {
          // Créer un nouvel item
          const mondayItemId = await mondayService.createItem(candidature);
          
          if (mondayItemId) {
            // Mettre à jour la candidature avec l'ID Monday
            await candidatureService.updateCandidature(candidature.id, { monday_item_id: mondayItemId });
            
            results.success++;
            results.details.push({
              candidatureId: candidature.id,
              status: 'created',
              mondayItemId,
            });
          } else {
            results.failures++;
            results.details.push({
              candidatureId: candidature.id,
              status: 'failed',
              error: 'Création échouée',
            });
          }
        } else {
          // Mettre à jour l'item existant
          const updated = await mondayService.updateItem(candidature);
          
          if (updated) {
            results.success++;
            results.details.push({
              candidatureId: candidature.id,
              status: 'updated',
              mondayItemId: candidature.monday_item_id,
            });
          } else {
            results.failures++;
            results.details.push({
              candidatureId: candidature.id,
              status: 'failed',
              error: 'Mise à jour échouée',
            });
          }
        }
      } catch (error) {
        results.failures++;
        results.details.push({
          candidatureId: candidature.id,
          status: 'failed',
          error: error.message,
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Synchronisation terminée: ${results.success} réussies, ${results.failures} échouées`,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation globale avec Monday',
      error: error.message,
    });
  }
};

// Récupérer tous les boards Monday
exports.getBoards = async (req, res) => {
  try {
    const boards = await mondayService.getBoards();
    
    res.status(200).json({
      success: true,
      boards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des boards Monday',
      error: error.message,
    });
  }
};

// Récupérer les colonnes d'un board Monday
exports.getBoardColumns = async (req, res) => {
  try {
    const { boardId } = req.params;
    
    const columns = await mondayService.getBoardColumns(boardId);
    
    res.status(200).json({
      success: true,
      columns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des colonnes du board',
      error: error.message,
    });
  }
};

// Configuration d'un webhook Monday
exports.setupWebhook = async (req, res) => {
  try {
    const { callbackUrl } = req.body;
    
    if (!callbackUrl) {
      return res.status(400).json({
        success: false,
        message: 'L\'URL de callback est requise',
      });
    }
    
    const webhookId = await mondayService.setupWebhook(callbackUrl);
    
    res.status(200).json({
      success: true,
      message: 'Webhook configuré avec succès',
      webhookId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la configuration du webhook',
      error: error.message,
    });
  }
};

// Vérifier le statut de connexion à Monday
exports.getConnectionStatus = async (req, res) => {
  try {
    const status = await mondayService.checkConnection();
    
    if (status.connected) {
      res.status(200).json({
        success: true,
        connected: true,
        username: status.username,
      });
    } else {
      res.status(200).json({
        success: true,
        connected: false,
        error: status.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de la connexion Monday',
      error: error.message,
    });
  }
}; 