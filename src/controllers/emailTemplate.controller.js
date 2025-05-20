const emailTemplateService = require('../services/emailTemplate.service');
const { validationResult } = require('express-validator');

/**
 * Contrôleur pour la gestion des templates d'email.
 */

// Lister tous les templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await emailTemplateService.getAllTemplates();
    res.status(200).json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des templates.', error: error.message });
  }
};

// Récupérer un template par son ID
exports.getTemplateById = async (req, res) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    if (isNaN(templateId)) {
      return res.status(400).json({ success: false, message: 'ID de template invalide.' });
    }
    const template = await emailTemplateService.getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template non trouvé.' });
    }
    res.status(200).json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération du template.', error: error.message });
  }
};

// Mettre à jour un template par son ID
exports.updateTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const templateId = parseInt(req.params.id, 10);
    if (isNaN(templateId)) {
      return res.status(400).json({ success: false, message: 'ID de template invalide.' });
    }

    const { subject, body, description } = req.body;
    const updateData = {};
    if (subject !== undefined) updateData.subject = subject;
    if (body !== undefined) updateData.body = body;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune donnée de mise à jour fournie.' });
    }

    const updatedTemplate = await emailTemplateService.updateTemplate(templateId, updateData);

    if (!updatedTemplate) {
      return res.status(404).json({ success: false, message: 'Template non trouvé pour la mise à jour.' });
    }
    res.status(200).json({ success: true, message: 'Template mis à jour avec succès.', template: updatedTemplate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour du template.', error: error.message });
  }
};

// Créer un template (utilisé pour l'initialisation / seeders, si nécessaire via API protégée)
// Pour l'instant, cette route sera protégée et potentiellement non exposée largement
exports.createTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, subject, body, description } = req.body;
    if (!name || !subject || !body) {
        return res.status(400).json({ success: false, message: 'Les champs name, subject, et body sont requis.'});
    }

    const newTemplate = await emailTemplateService.createTemplate({ name, subject, body, description });
    res.status(201).json({ success: true, message: 'Template créé avec succès.', template: newTemplate });
  } catch (error) {
    // Gérer l'erreur de nom de template dupliqué
    if (error.message.includes('existe déjà')) {
        return res.status(409).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la création du template.', error: error.message });
  }
}; 