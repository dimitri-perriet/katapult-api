const axios = require('axios');
const db = require('../../models');

// Configuration de l'API Monday.com
const mondayConfig = {
  apiUrl: process.env.MONDAY_API_URL || 'https://api.monday.com/v2',
  apiKey: process.env.MONDAY_API_KEY,
  boardId: process.env.MONDAY_BOARD_ID,
};

// Mapper les statuts de candidature vers les valeurs de Monday
// Les valeurs à droite doivent correspondre aux options de la colonne "Statut" dans votre tableau Monday
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
          'Authorization': `Bearer ${mondayConfig.apiKey}`,
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
      
      // S'assurer que le nom du projet n'est pas vide
      const projectName = itemName && itemName.trim() !== '' ? itemName : "Projet sans nom";
      
      console.log(`Tentative de création d'un nouvel item dans Monday.com: ${projectName}`);
      
      // Fonction pour tronquer et nettoyer les textes longs
      const cleanText = (text, maxLength = 500) => {
        if (!text) return "";
        // Limiter la longueur et échapper les caractères spéciaux
        return String(text).substring(0, maxLength)
          .replace(/\\/g, "\\\\")
          .replace(/\n/g, " ")
          .replace(/\r/g, "")
          .replace(/\t/g, " ")
          .replace(/"/g, '\\"');
      };
      
      // Déterminer la région (HN/BN)
      let region = '';
      const dpt = (itemData.department || '').trim(); 
      const normRegions = ['27', '76']; // Départements de l'ex-Haute Normandie
      
      if (normRegions.includes(dpt)) {
        region = 'exHN';
      } else if (dpt === '14' || dpt === '50' || dpt === '61') {
        region = 'exBN';
      } else if (dpt) {
        region = 'Hors Normandie';
      }
      
      // Utiliser uniquement les colonnes qui fonctionnent selon nos tests
      const columnValues = {
        // Colonnes de base (toutes en texte selon la structure récupérée)
        "text_mkqbv9ks": "Date réception", // Date réception
        "text_mkqbtxmh": cleanText(itemData.location || ""), // Localisation
        "text_mkqb4w6": cleanText(itemData.location || ""), // Lieu
        "text_mkqbktmv": itemData.department || "", // Dpt
        "text_mkqbc9ak": region || "", // HN/BN
        
        // Colonnes supplémentaires (toutes en texte)
        "text_mkqbgeza": cleanText(itemData.porterName || ""), // NOM Prénom PP principal
        "long_text_mkqbm5qx": cleanText(itemData.shortDescription || ""), // Courte description
        "text_mkqb77mg": cleanText(itemData.phone || ""), // Tel
        "text_mkqbf1xr": cleanText(itemData.porterEmail || "") // Email
      };
      
      // Remplir les valeurs de texte pour les colonnes de statut
      if (itemData.department) {
        columnValues.text_mkqbktmv = itemData.department; // Dpt
      }
      
      if (region) {
        columnValues.text_mkqbc9ak = region; // HN/BN
      }
      
      if (itemData.location) {
        columnValues.text_mkqbtxmh = cleanText(itemData.location); // Localisation
        columnValues.text_mkqb4w6 = cleanText(itemData.location); // Lieu
      }
      
      console.log('Colonnes utilisées:', Object.keys(columnValues).join(', '));
      console.log('Valeurs des colonnes:', JSON.stringify(columnValues));
      
      // Échapper correctement les guillemets pour le format attendu par Monday
      const escapedColumnValues = JSON.stringify(columnValues).replace(/"/g, '\\"');
      
      // Construire la requête GraphQL directement comme dans le test qui fonctionne
      const query = `
        mutation {
          create_item(
            board_id: ${parseInt(boardId)},
            item_name: "${projectName.replace(/"/g, '\\"')}",
            column_values: "${escapedColumnValues}"
          ) {
            id
          }
        }
      `;
      
      // Faire l'appel à l'API comme dans le test qui fonctionne
      const response = await axios.post(
        'https://api.monday.com/v2', 
        { query }, 
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': apiKey
          }
        }
      );
      
      console.log('Réponse de Monday.com pour create_item:', JSON.stringify(response.data));
      
      if (response.data && response.data.data && response.data.data.create_item) {
        const itemId = response.data.data.create_item.id;
        console.log(`Item créé avec succès dans Monday.com avec l'ID: ${itemId}`);
        console.log(`Visualisable à l'adresse: https://hommetmilans-team.monday.com/boards/${boardId}/pulses/${itemId}`);
        
        return {
          id: itemId,
          name: projectName,
          ...itemData
        };
      } else if (response.data && response.data.errors) {
        console.error('Erreurs GraphQL lors de la création dans Monday.com:', JSON.stringify(response.data.errors));
        //throw new Error(`Erreur GraphQL: ${JSON.stringify(response.data.errors)}`);
      }
      
      //throw new Error('Échec de la création de l\'item dans Monday.com - réponse inattendue');
    } catch (error) {
      console.error('Erreur lors de la création de l\'item dans Monday.com:', error);
      //throw error;
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
      const boardId = process.env.MONDAY_BOARD_ID;
      
      if (!apiKey) {
        console.warn('Configuration Monday.com manquante - mise à jour d\'item ignorée');
        return null;
      }
      
      console.log(`Tentative de mise à jour de l'item ${itemId} dans Monday.com`);
      
      // Fonction pour tronquer et nettoyer les textes longs
      const cleanText = (text, maxLength = 500) => {
        if (!text) return "";
        return String(text).substring(0, maxLength)
          .replace(/\\/g, "\\\\")
          .replace(/\n/g, " ")
          .replace(/\r/g, "")
          .replace(/\t/g, " ")
          .replace(/"/g, '\\"');
      };
      
      // Déterminer la région (HN/BN)
      let region = '';
      const dpt = (itemData.department || '').trim(); 
      const normRegions = ['27', '76']; // Départements de l'ex-Haute Normandie
      
      if (normRegions.includes(dpt)) {
        region = 'exHN';
      } else if (dpt === '14' || dpt === '50' || dpt === '61') {
        region = 'exBN';
      } else if (dpt) {
        region = 'Hors Normandie';
      }
      
      // Utiliser uniquement les colonnes qui fonctionnent selon nos tests
      const columnValues = {
        // Colonnes de base (toutes en texte selon la structure récupérée)
        "text_mkqbv9ks": "Date réception", // Date réception
        "text_mkqbtxmh": cleanText(itemData.location || ""), // Localisation
        "text_mkqb4w6": cleanText(itemData.location || ""), // Lieu
        "text_mkqbktmv": itemData.department || "", // Dpt
        "text_mkqbc9ak": region || "", // HN/BN
        
        // Colonnes supplémentaires (toutes en texte)
        "text_mkqbgeza": cleanText(itemData.porterName || ""), // NOM Prénom PP principal
        "long_text_mkqbm5qx": cleanText(itemData.shortDescription || ""), // Courte description
        "text_mkqb77mg": cleanText(itemData.phone || ""), // Tel
        "text_mkqbf1xr": cleanText(itemData.porterEmail || "") // Email
      };
      
      // Remplir les valeurs de texte pour les colonnes de statut
      if (itemData.department) {
        columnValues.text_mkqbktmv = itemData.department; // Dpt
      }
      
      if (region) {
        columnValues.text_mkqbc9ak = region; // HN/BN
      }
      
      if (itemData.location) {
        columnValues.text_mkqbtxmh = cleanText(itemData.location); // Localisation
        columnValues.text_mkqb4w6 = cleanText(itemData.location); // Lieu
      }
      
      // Le nom du projet est géré par le nom de l'élément, pas par une colonne
      const projectName = itemData.name || "Projet sans nom";
      
      // Échapper correctement les guillemets pour le format attendu par Monday
      const escapedColumnValues = JSON.stringify(columnValues).replace(/"/g, '\\"');
      
      // Utiliser exactement la même structure de requête qui fonctionne
      const query = `
        mutation {
          change_multiple_column_values(
            item_id: ${parseInt(itemId, 10)},
            board_id: ${parseInt(boardId, 10)},
            column_values: "${escapedColumnValues}"
          ) {
            id
          }
        }
      `;
      
      console.log('Query GraphQL pour mise à jour:', query.substring(0, 200) + '...');
      console.log('Colonnes utilisées:', Object.keys(columnValues).join(', '));
      
      // Faire l'appel à l'API
      const response = await axios.post(
        'https://api.monday.com/v2', 
        { query }, 
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': apiKey // Sans préfixe "Bearer"
          }
        }
      );
      
      console.log('Réponse de Monday.com pour update_item:', JSON.stringify(response.data));
      
      if (response.data && response.data.errors) {
        console.error('Erreurs GraphQL lors de la mise à jour dans Monday.com:', JSON.stringify(response.data.errors));
        return null;
      }
      
      // Si nous voulons changer le nom de l'élément, faire une deuxième requête
      if (projectName !== "Projet sans nom") {
        try {
          const renameQuery = `
            mutation {
              change_item_name(
                item_id: ${parseInt(itemId, 10)},
                board_id: ${parseInt(boardId, 10)},
                new_name: "${projectName.replace(/"/g, '\\"')}"
              ) {
                id
                name
              }
            }
          `;
          
          console.log('Query GraphQL pour renommer:', renameQuery);
          
          const renameResponse = await axios.post(
            'https://api.monday.com/v2', 
            { query: renameQuery }, 
            {
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': apiKey
              }
            }
          );
          
          console.log('Réponse de Monday.com pour renommer:', JSON.stringify(renameResponse.data));
        } catch (renameError) {
          console.warn('Erreur lors du renommage de l\'item (non bloquant):', renameError.message);
        }
      }
      
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
      
      console.log(`Tentative de mise à jour des colonnes pour l'item ${itemId} dans Monday.com`);
      
      // Préparation des valeurs de colonnes au format exact qui fonctionne
      const columnValues = {
        // Pas de colonne status dans la structure récupérée
      };
      
      // Date réception (date de soumission)
      if (itemData.submissionDate) {
        columnValues["text_mkqbv9ks"] = itemData.submissionDate;
      }
      
      // NOM Prénom PP principal
      if (itemData.porterName) {
        columnValues["text_mkqbgeza"] = cleanText(itemData.porterName);
      }
      
      // Courte description
      if (itemData.shortDescription) {
        columnValues["long_text_mkqbm5qx"] = cleanText(itemData.shortDescription);
      }
      
      // Localisation
      if (itemData.location) {
        columnValues["text_mkqbtxmh"] = cleanText(itemData.location);
        columnValues["text_mkqb4w6"] = cleanText(itemData.location);
      }
      
      // Email
      if (itemData.porterEmail) {
        columnValues["text_mkqbf1xr"] = cleanText(itemData.porterEmail);
      }
      
      // Tel
      if (itemData.phone) {
        columnValues["text_mkqb77mg"] = cleanText(itemData.phone);
      }
      
      // Échapper correctement les guillemets comme dans la requête curl réussie
      const escapedColumnValues = JSON.stringify(columnValues).replace(/"/g, '\\"');
      
      // Utiliser exactement la même structure de requête que celle qui fonctionne avec curl
      const query = `mutation { change_multiple_column_values(item_id: ${parseInt(itemId, 10)}, board_id: ${parseInt(boardId, 10)}, column_values: "${escapedColumnValues}") { id } }`;
      
      console.log('Requête GraphQL pour mise à jour des colonnes:', query);
      
      const response = await axios.post(
        mondayConfig.apiUrl, 
        { query }, 
        {
          headers: { 
            'Authorization': apiKey, // Utiliser le token directement sans "Bearer "
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Réponse de Monday.com pour update_columns:', JSON.stringify(response.data));
      
      if (response.data && response.data.errors) {
        console.error('Erreurs GraphQL lors de la mise à jour des colonnes:', response.data.errors);
        return false;
      }
      
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
      
      // Préparer les données de statut
      const columnValues = {
        status: { text: statusColumn }
      };

      // Échapper correctement les guillemets pour la chaîne JSON comme dans curl
      const escapedColumnValues = JSON.stringify(columnValues).replace(/"/g, '\\"');

      // Requête GraphQL directe dans le format qui fonctionne
      const query = `mutation { change_multiple_column_values(item_id: ${parseInt(candidature.monday_item_id, 10)}, board_id: ${parseInt(mondayConfig.boardId, 10)}, column_values: "${escapedColumnValues}") { id } }`;
      
      console.log('Requête GraphQL pour mise à jour du statut:', query);

      try {
        const response = await axios.post(
          mondayConfig.apiUrl,
          { query },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': mondayConfig.apiKey // Utiliser le token directement sans "Bearer "
            }
          }
        );

        console.log('Réponse pour mise à jour du statut:', JSON.stringify(response.data));

        if (response.data.errors) {
          console.error('Erreurs GraphQL lors de la mise à jour du statut:', response.data.errors);
          return false;
        }

        return true;
      } catch (error) {
        console.error('Exception lors de la mise à jour du statut:', error.message);
        return false;
      }
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
        query {
          items(ids: [${parseInt(itemId)}]) {
            id
            name
            column_values {
              id
              title
              value
              text
            }
          }
        }
      `;

      // Exécuter la requête directement sans variables
      const response = await axios.post(
        mondayConfig.apiUrl,
        { query },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': mondayConfig.apiKey
          }
        }
      );
      
      if (response.data.errors) {
        console.error('Erreurs GraphQL lors de la récupération de l\'item:', JSON.stringify(response.data.errors));
        return null;
      }
      
      if (response.data.data && response.data.data.items && response.data.data.items.length > 0) {
        return response.data.data.items[0];
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
      
      console.log(`Synchronisation de la candidature ${candidatureId} avec Monday.com - Statut: ${candidature.status}`);
      
      // Extraire les données du porteur de projet (user)
      const user = candidature.user;
      
      // Extraire les informations de la candidature et parser les JSON
      const ficheIdentite = typeof candidature.fiche_identite === 'string' 
        ? JSON.parse(candidature.fiche_identite) 
        : candidature.fiche_identite || {};
      
      const projetUtiliteSociale = typeof candidature.projet_utilite_sociale === 'string' 
        ? JSON.parse(candidature.projet_utilite_sociale) 
        : candidature.projet_utilite_sociale || {};
      
      const quiEstConcerne = typeof candidature.qui_est_concerne === 'string' 
        ? JSON.parse(candidature.qui_est_concerne) 
        : candidature.qui_est_concerne || {};
      
      // Récupérer le nom du projet
      const projectName = ficheIdentite.projectName || 'Projet sans nom';
      
      // Compiler une description courte du projet
      let shortDescription = projetUtiliteSociale.shortDescription || '';
      if (!shortDescription && projetUtiliteSociale.projectSummary) {
        shortDescription = projetUtiliteSociale.projectSummary.substring(0, 100);
      }
      
      // Extraire les informations de localisation
      const location = ficheIdentite.territory || '';
      
      // Extraire le département si disponible
      let department = '';
      if (ficheIdentite.postalCode && ficheIdentite.postalCode.length >= 2) {
        department = ficheIdentite.postalCode.substring(0, 2);
      } else if (location.includes('(') && location.includes(')')) {
        const match = location.match(/\((\d{2})\)/);
        if (match && match[1]) {
          department = match[1];
        }
      }
      
      // Déterminer la région (HN/BN)
      let region = '';
      const normRegions = ['27', '76']; // Départements de l'ex-Haute Normandie
      
      if (normRegions.includes(department)) {
        region = 'exHN';
      } else if (department === '14' || department === '50' || department === '61') {
        region = 'exBN';
      } else if (department) {
        region = 'Hors Normandie';
      }
      
      // Extraire la zone d'intervention
      const interventionZone = ficheIdentite.interventionZone || 
                              quiEstConcerne.geographicArea || 
                              '';
      
      // Extraire le numéro de téléphone
      const phone = user.phone || ficheIdentite.contactPhone || candidature.phone || '';
      
      // Préparer les données pour Monday.com avec les champs qui fonctionnent
      const mondayData = {
        // Informations de base
        porterName: `${user.first_name} ${user.last_name}`,
        porterEmail: user.email,
        phone: phone,
        
        // Détails du projet
        shortDescription: shortDescription || projetUtiliteSociale.projectSummary || 'Pas de description',
        sector: ficheIdentite.sector || projetUtiliteSociale.sector || '',
        location: location,
        department: department,
        region: region,
        interventionZone: interventionZone,
        
        // Métadonnées
        submissionDate: candidature.submission_date ? new Date(candidature.submission_date).toISOString() : null,
        status: candidature.status || 'brouillon',
        promotion: candidature.promotion || ''
      };
      
      console.log("Données préparées pour Monday:", JSON.stringify(mondayData));
      
      // Déterminer si nous devons créer un nouvel item ou mettre à jour un existant
      if (candidature.monday_item_id) {
        // Mettre à jour l'item existant
        const result = await exports.syncWithMonday.updateItem(
          candidature.monday_item_id,
          mondayData
        );
        
        if (result) {
          console.log(`Synchronisation réussie de la candidature ${candidatureId} avec Monday.com`);
        } else {
          console.error(`Échec de la synchronisation de la candidature ${candidatureId} avec Monday.com`);
        }
        
        return result;
      } else {
        // Créer un nouvel item
        const mondayItem = await exports.syncWithMonday.createItem(
          projectName,
          mondayData
        );
        
        // Mettre à jour la candidature avec l'ID de l'item Monday
        if (mondayItem && mondayItem.id) {
          await candidatureService.updateCandidature(candidatureId, {
            monday_item_id: mondayItem.id
          });
          console.log(`Candidature ${candidatureId} liée à l'item Monday.com ${mondayItem.id}`);
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

  /**
   * Récupérer la structure des colonnes du tableau Monday.com
   * @returns {Promise<Object>} Structure des colonnes
   */
  getBoardColumns: async function() {
    try {
      const apiKey = process.env.MONDAY_API_KEY;
      const boardId = process.env.MONDAY_BOARD_ID;
      
      if (!apiKey || !boardId) {
        console.warn('Configuration Monday.com manquante');
        return null;
      }
      
      const query = `
        query {
          boards(ids: [${parseInt(boardId)}]) {
            columns {
              id
              title
              type
              settings_str
            }
          }
        }
      `;
      
      const response = await axios.post(
        'https://api.monday.com/v2', 
        { query }, 
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': apiKey
          }
        }
      );
      
      console.log('Structure des colonnes Monday.com:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.data && response.data.data.boards && response.data.data.boards.length > 0) {
        return response.data.data.boards[0].columns;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la structure des colonnes:', error);
      return null;
    }
  },
};