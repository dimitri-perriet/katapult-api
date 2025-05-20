const db = require('../../models');

class EmailTemplateService {
  /**
   * Récupérer tous les templates d'email.
   * @returns {Promise<Array<db.EmailTemplate>>}
   */
  async getAllTemplates() {
    return await db.EmailTemplate.findAll({ order: [['name', 'ASC']] });
  }

  /**
   * Récupérer un template d'email par son nom.
   * @param {string} name - Nom unique du template.
   * @returns {Promise<db.EmailTemplate|null>}
   */
  async getTemplateByName(name) {
    const template = await db.EmailTemplate.findOne({ where: { name } });
    if (!template) {
      // Optionnel: throw new Error('Template non trouvé');
      // Ou retourner null et laisser le contrôleur gérer le 404
      return null;
    }
    return template;
  }

  /**
   * Récupérer un template d'email par son ID.
   * @param {number} id - ID du template.
   * @returns {Promise<db.EmailTemplate|null>}
   */
  async getTemplateById(id) {
    const template = await db.EmailTemplate.findByPk(id);
    if (!template) {
      return null;
    }
    return template;
  }

  /**
   * Mettre à jour un template d'email.
   * L'ID est utilisé pour trouver le template, le champ 'name' ne doit pas être modifiable par cette fonction
   * pour éviter des désynchronisations, ou alors il faudrait gérer la mise à jour de références.
   * @param {number} id - ID du template à mettre à jour.
   * @param {Object} updateData - Données à mettre à jour (subject, body, description).
   * @returns {Promise<db.EmailTemplate|null>}
   */
  async updateTemplate(id, updateData) {
    const template = await db.EmailTemplate.findByPk(id);
    if (!template) {
      return null; // Ou throw new Error('Template non trouvé pour la mise à jour');
    }

    // Champs autorisés à la mise à jour
    const allowedUpdates = {};
    if (updateData.subject !== undefined) allowedUpdates.subject = updateData.subject;
    if (updateData.body !== undefined) allowedUpdates.body = updateData.body;
    if (updateData.description !== undefined) allowedUpdates.description = updateData.description;

    if (Object.keys(allowedUpdates).length === 0) {
      return template; // Aucune modification valide fournie
    }

    await template.update(allowedUpdates);
    return template;
  }

  /**
   * Créer un nouveau template d'email (principalement pour les seeders ou initialisation).
   * Il est généralement préférable que les templates soient prédéfinis et seulement modifiables.
   * @param {Object} templateData - Données du template (name, subject, body, description).
   * @returns {Promise<db.EmailTemplate>}
   */
  async createTemplate(templateData) {
    // Vérifier si un template avec ce nom existe déjà
    const existingTemplate = await db.EmailTemplate.findOne({ where: { name: templateData.name } });
    if (existingTemplate) {
      throw new Error(`Un template avec le nom "${templateData.name}" existe déjà.`);
    }

    return await db.EmailTemplate.create(templateData);
  }
  
  // Pas de fonction de suppression pour l'instant, car les templates sont critiques.
  // Si nécessaire, elle pourrait être ajoutée avec prudence.
}

module.exports = new EmailTemplateService(); 