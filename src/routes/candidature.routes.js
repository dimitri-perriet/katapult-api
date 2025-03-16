const express = require('express');
const { body } = require('express-validator');
const candidatureController = require('../controllers/candidature.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');
const { uploadFile } = require('../middleware/file-upload');

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateJWT);

// Validation pour les notes internes
const internalNoteValidation = [
  body('content').notEmpty().withMessage('Le contenu de la note est requis'),
];

// Validation pour les relances
const reminderValidation = [
  body('message').notEmpty().withMessage('Le message de relance est requis'),
  body('date').isISO8601().toDate().withMessage('La date doit être au format ISO 8601'),
];

// Routes pour la création et récupération de candidatures
router.route('/')
  .post(authorizeRoles(['candidat']), candidatureController.createCandidature)
  .get(candidatureController.getAllCandidatures);

// Route pour obtenir les statistiques des candidatures
router.get('/stats', authorizeRoles(['admin', 'evaluateur']), candidatureController.getCandidatureStats);

// Routes pour les opérations sur une candidature spécifique
router.route('/:id')
  .get(candidatureController.getCandidature)
  .put(candidatureController.updateCandidature);

// Route pour soumettre une candidature
router.post('/:id/submit', authorizeRoles(['candidat']), candidatureController.submitCandidature);

// Route pour ajouter une note interne à une candidature
router.post('/:id/notes', authorizeRoles(['admin', 'evaluateur']), candidatureController.addInternalNote);

// Route pour programmer une relance
router.post('/:id/reminders', authorizeRoles(['admin']), candidatureController.scheduleReminder);

// Route pour télécharger des fichiers liés à une candidature
router.post('/:id/upload/:documentType', 
  authorizeRoles(['candidat', 'admin']), 
  uploadFile.single('file'), 
  async (req, res) => {
    try {
      // Le fichier est géré par le middleware uploadFile
      // req.file contient les informations sur le fichier téléchargé
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier n\'a été téléchargé',
        });
      }
      
      // Récupérer les détails du fichier
      const fileDetails = {
        type: req.params.documentType,
        url: req.file.path, // URL du fichier stocké
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadDate: Date.now(),
      };
      
      // Mettre à jour la candidature avec le nouveau document
      const candidature = await candidatureController.addDocumentToCandidature(
        req.params.id, 
        fileDetails,
        req.user.id
      );
      
      res.status(200).json({
        success: true,
        message: 'Fichier téléchargé avec succès',
        file: fileDetails,
        candidature,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement du fichier',
        error: error.message,
      });
    }
});

// Route pour générer un PDF de la candidature
router.get('/:id/pdf', authorizeRoles(['candidat', 'admin', 'evaluateur']), async (req, res) => {
  try {
    const pdfPath = await candidatureController.generateCandidaturePDF(req.params.id, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'PDF généré avec succès',
      pdfUrl: pdfPath,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: error.message,
    });
  }
});

// Route pour synchroniser une candidature avec Monday.com
router.post('/:id/sync-monday', authorizeRoles(['admin']), async (req, res) => {
  try {
    const result = await candidatureController.syncWithMonday(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Synchronisation avec Monday.com réussie',
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation avec Monday.com',
      error: error.message,
    });
  }
});

module.exports = router; 