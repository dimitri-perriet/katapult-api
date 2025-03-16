const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Configuration du stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Créer un dossier pour les fichiers de candidature
    const uploadDir = path.join(__dirname, '../../uploads/candidatures');
    
    // Créer un sous-dossier pour chaque candidature basé sur son ID
    const candidatureDir = path.join(uploadDir, req.params.id);
    
    // Vérifier si le dossier existe, sinon le créer
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    if (!fs.existsSync(candidatureDir)) {
      fs.mkdirSync(candidatureDir, { recursive: true });
    }
    
    cb(null, candidatureDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique basé sur le timestamp et le type de document
    const fileExtension = path.extname(file.originalname);
    const documentType = req.params.documentType || 'document';
    const timestamp = Date.now();
    
    cb(null, `${documentType}_${timestamp}${fileExtension}`);
  }
});

// Filtre des fichiers autorisés
const fileFilter = (req, file, cb) => {
  // Types de fichiers autorisés
  const allowedFileTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    // Texte
    'text/plain',
    'text/csv',
  ];
  
  // Vérifier si le type du fichier est autorisé
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls les documents, images et fichiers texte sont acceptés.'), false);
  }
};

// Limites des fichiers
const limits = {
  fileSize: 10 * 1024 * 1024, // 10 MB
};

// Configuration de multer pour l'upload de fichiers
const uploadFile = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

// Middleware pour gérer les erreurs d'upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erreurs spécifiques à multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'La taille du fichier dépasse la limite autorisée (10 MB)',
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Erreur lors de l'upload du fichier : ${err.message}`,
    });
  } else if (err) {
    // Autres erreurs
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
  
  next();
};

module.exports = {
  uploadFile,
  handleUploadError,
}; 