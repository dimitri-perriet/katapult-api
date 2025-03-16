const axios = require('axios');
const db = require('../../models');

// Configuration de l'API Monday.com
const mondayConfig = {
  apiUrl: process.env.MONDAY_API_URL || 'https://api.monday.com/v2',
  apiKey: process.env.MONDAY_API_KEY,
  boardId: process.env.MONDAY_BOARD_ID,
};

// Mapper les statuts de candidature vers les valeurs de Monday
const statusMapping = {
  'brouillon': 'Brouillon',
  'soumise': 'Soumise',
  'en_cours_d_evaluation': 'En cours d\'évaluation',
  'présélectionnée': 'Présélectionnée',
  'acceptée': 'Acceptée',
  'refusée': 'Refusée',
};

// Fonction pour effectuer une requête GraphQL vers Monday.com
const executeQuery = async (query, variables = {}) => {
  try {
    const response = await axios.post(
      mondayConfig.apiUrl,
      { query, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': mondayConfig.apiKey,
        },
      }
    );

    if (response.data.errors) {
      throw new Error(`Erreur GraphQL: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la requête à Monday.com:', error.message);
    throw error;
  }
};

// Services pour Monday.com
exports.syncWithMonday = {
  // Créer un nouvel item dans Monday.com
  createItem: async function(itemName, itemData) {
    try {
      const apiKey = process.env.MONDAY_API_KEY;
      const boardId = process.env.MONDAY_BOARD_ID;
      
      if (!apiKey || !boardId) {
        console.warn('Configuration Monday.com manquante - création d\'item ignorée');
        return null;
      }
      
      // Colonnes configurées dans Monday.com
      const mutation = `
        mutation {
          create_item (board_id: ${boardId}, item_name: "${itemName}") {
            id
          }
        }
      `;
      
      const response = await axios.post(mondayConfig.apiUrl, { query: mutation }, {
        headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' }
      });
      
      if (response.data && response.data.data && response.data.data.create_item) {
        const itemId = response.data.data.create_item.id;
        
        // Mise à jour des colonnes avec les données de l'item
        await this.updateItemColumns(itemId, itemData);
        
        return {
          id: itemId,
          name: itemName,
          ...itemData
        };
      }
      
      throw new Error('Échec de la création de l\'item dans Monday.com');
    } catch (error) {
      console.error('Erreur lors de la création de l\'item dans Monday.com:', error);
      return null;
    }
  },
  
  /**
   * Mettre à jour un item existant dans Monday.com
   * @param {string} itemId - ID de l'item Monday.com
   * @param {Object} itemData - Données de l'item
   * @returns {Promise<Object>} - Item mis à jour
   */
  updateItem: async function(itemId, itemData) {
    try {
      const apiKey = process.env.MONDAY_API_KEY;
      
      if (!apiKey) {
        console.warn('Configuration Monday.com manquante - mise à jour d\'item ignorée');
        return null;
      }
      
      // Mise à jour du nom de l'item si fourni
      if (itemData.name) {
        const mutation = `
          mutation {
            change_multiple_column_values(item_id: ${itemId}, board_id: ${process.env.MONDAY_BOARD_ID}, column_values: ${JSON.stringify(JSON.stringify({ name: itemData.name }))}) {
              id
              name
            }
          }
        `;
        
        await axios.post(mondayConfig.apiUrl, { query: mutation }, {
          headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' }
        });
      }
      
      // Mise à jour des colonnes avec les données de l'item
      await this.updateItemColumns(itemId, itemData);
      
      return {
        id: itemId,
        ...itemData
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'item dans Monday.com:', error);
      return null;
    }
  },
  
  /**
   * Mettre à jour les colonnes d'un item dans Monday.com
   * @param {string} itemId - ID de l'item Monday.com
   * @param {Object} itemData - Données de l'item
   * @returns {Promise<boolean>} - Indicateur de réussite
   * @private
   */
  updateItemColumns: async function(itemId, itemData) {
    try {
      const apiKey = process.env.MONDAY_API_KEY;
      const boardId = process.env.MONDAY_BOARD_ID;
      
      if (!apiKey || !boardId) {
        return false;
      }
      
      // Préparation des valeurs de colonnes en format JSON
      const columnValues = {};
      
      // Cartographie des champs itemData vers les noms de colonnes Monday.com
      if (itemData.status) {
        columnValues.status = { label: this.mapStatusToMondayStatus(itemData.status) };
      }
      
      if (itemData.sector) {
        columnValues.text0 = itemData.sector;
      }
      
      if (itemData.porterName) {
        columnValues.text = itemData.porterName;
      }
      
      if (itemData.porterEmail) {
        columnValues.email = { email: itemData.porterEmail, text: itemData.porterEmail };
      }
      
      if (itemData.maturity) {
        columnValues.text5 = itemData.maturity;
      }
      
      if (itemData.submissionDate) {
        columnValues.date = { date: itemData.submissionDate };
      }
      
      if (itemData.completionPercentage !== undefined) {
        columnValues.numbers = itemData.completionPercentage;
      }
      
      // Conversion en JSON stringifié pour l'API Monday
      const columnValuesJson = JSON.stringify(columnValues);
      
      const mutation = `
        mutation {
          change_multiple_column_values(item_id: ${itemId}, board_id: ${boardId}, column_values: ${JSON.stringify(columnValuesJson)}) {
            id
          }
        }
      `;
      
      const response = await axios.post(mondayConfig.apiUrl, { query: mutation }, {
        headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' }
      });
      
      return response.data && response.data.data && response.data.data.change_multiple_column_values;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des colonnes dans Monday.com:', error);
      return false;
    }
  },

  // Mettre à jour uniquement le statut d'un item
  updateItemStatus: async (candidatureId, newStatus) => {
    try {
      // Vérifier la configuration
      if (!mondayConfig.apiKey || !mondayConfig.boardId) {
        console.warn('Configuration Monday.com manquante. Mise à jour désactivée.');
        return false;
      }

      // Récupérer la candidature
      const candidature = await db.Candidature.findByPk(candidatureId);

      if (!candidature || !candidature.monday_item_id) {
        console.warn('Candidature ou ID Monday.com manquant.');
        return false;
      }

      // Mapper le statut
      const statusColumn = statusMapping[newStatus] || 'Brouillon';

      // Query pour mettre à jour le statut
      const query = `
        mutation ($itemId: Int!, $columnValues: JSON!) {
          change_multiple_column_values (
            item_id: $itemId,
            board_id: ${mondayConfig.boardId},
            column_values: $columnValues
          ) {
            id
          }
        }
      `;

      // Variables pour la requête
      const variables = {
        itemId: parseInt(candidature.monday_item_id),
        columnValues: JSON.stringify({
          status: { label: statusColumn }
        }),
      };

      // Exécuter la requête
      await executeQuery(query, variables);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut dans Monday.com:', error.message);
      return false;
    }
  },

  // Récupérer un item depuis Monday.com
  getItem: async (itemId) => {
    if (!mondayConfig.apiKey || !mondayConfig.boardId) {
      console.warn('Configuration Monday.com manquante. Récupération désactivée.');
      return null;
    }

    try {
      // Query pour récupérer un item
      const query = `
        query ($itemId: Int!) {
          items (ids: [$itemId], board_id: ${mondayConfig.boardId}) {
            id
            name
            column_values {
              id
              title
              text
              value
            }
          }
        }
      `;

      // Variables pour la requête
      const variables = {
        itemId: parseInt(itemId),
      };

      // Exécuter la requête
      const result = await executeQuery(query, variables);
      
      if (result.items && result.items.length > 0) {
        return result.items[0];
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération d\'un item depuis Monday.com:', error.message);
      return null;
    }
  },

  /**
   * Synchroniser une candidature avec Monday.com
   * @param {String} candidatureId - ID de la candidature à synchroniser
   * @returns {Promise<boolean>} - Indicateur de réussite
   */
  syncCandidature: async (candidatureId) => {
    try {
      // Vérifier que les configurations de Monday sont définies
      if (!process.env.MONDAY_API_KEY || !process.env.MONDAY_BOARD_ID) {
        console.warn('Configuration Monday.com manquante - synchronisation ignorée');
        return null;
      }
      
      // Récupérer le service de candidature
      const candidatureService = require('./candidature.service');
      
      // Récupérer la candidature avec ses relations
      const candidature = await candidatureService.getCandidatureById(candidatureId, true);
      
      if (!candidature) {
        throw new Error(`Candidature ${candidatureId} non trouvée pour la synchronisation avec Monday.com`);
      }
      
      // Extraire les données du porteur de projet (user)
      const user = candidature.user;
      
      // Extraire les informations de la candidature
      const ficheIdentite = candidature.fiche_identite || {};
      const projetUtiliteSociale = candidature.projet_utilite_sociale || {};
      
      // Récupérer le nom du projet
      const projectName = ficheIdentite.projectName || 'Projet sans nom';
      
      // Déterminer si nous devons créer un nouvel item ou mettre à jour un existant
      if (candidature.monday_item_id) {
        // Mettre à jour l'item existant
        return await exports.updateItem(
          candidature.monday_item_id,
          {
            name: projectName,
            status: candidature.status,
            sector: projetUtiliteSociale.sector || 'Non spécifié',
            porterName: `${user.first_name} ${user.last_name}`,
            porterEmail: user.email,
            maturity: projetUtiliteSociale.maturityLevel || 'Non spécifié',
            submissionDate: candidature.submission_date ? new Date(candidature.submission_date).toISOString() : null,
            completionPercentage: candidature.getCompletionPercentage ? candidature.getCompletionPercentage() : 0
          }
        );
      } else {
        // Créer un nouvel item
        const mondayItem = await exports.createItem(
          projectName,
          {
            status: candidature.status,
            sector: projetUtiliteSociale.sector || 'Non spécifié',
            porterName: `${user.first_name} ${user.last_name}`,
            porterEmail: user.email,
            maturity: projetUtiliteSociale.maturityLevel || 'Non spécifié',
            submissionDate: candidature.submission_date ? new Date(candidature.submission_date).toISOString() : null,
            completionPercentage: candidature.getCompletionPercentage ? candidature.getCompletionPercentage() : 0
          }
        );
        
        // Mettre à jour la candidature avec l'ID de l'item Monday
        if (mondayItem && mondayItem.id) {
          await candidatureService.updateCandidature(candidatureId, {
            monday_item_id: mondayItem.id
          });
          return mondayItem;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la synchronisation avec Monday.com:', error);
      throw error;
    }
  },

  /**
   * Convertit un statut de candidature en statut Monday.com
   * @param {string} status - Statut de la candidature
   * @returns {string} - Statut Monday.com
   */
  mapStatusToMondayStatus: function(status) {
    const statusMapping = {
      'brouillon': 'Brouillon',
      'soumise': 'Soumise',
      'en_cours_evaluation': 'En cours d\'évaluation',
      'validee': 'Validée',
      'rejetee': 'Rejetée'
    };
    
    return statusMapping[status] || 'Brouillon';
  },
}; 