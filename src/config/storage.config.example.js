// Configuration du stockage cloud avec AWS S3
// Installer: npm install aws-sdk

const AWS = require('aws-sdk');

// Configuration AWS S3
const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-west-3', // Par défaut: région Paris
  bucket: process.env.AWS_BUCKET_NAME
};

// Initialisation du client S3
const s3 = new AWS.S3({
  accessKeyId: s3Config.accessKeyId,
  secretAccessKey: s3Config.secretAccessKey,
  region: s3Config.region
});

/**
 * Télécharge un fichier sur S3
 * @param {Buffer} fileBuffer - Le buffer du fichier
 * @param {string} fileName - Le nom du fichier (avec extension)
 * @param {string} folderPath - Le chemin du dossier dans le bucket (sans / à la fin)
 * @returns {Promise<string>} - L'URL du fichier téléchargé
 */
const uploadFile = async (fileBuffer, fileName, folderPath = '') => {
  const key = folderPath ? `${folderPath}/${fileName}` : fileName;
  
  const params = {
    Bucket: s3Config.bucket,
    Key: key,
    Body: fileBuffer,
    ACL: 'public-read', // Permet l'accès public au fichier
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location; // Retourne l'URL du fichier
  } catch (error) {
    console.error('Erreur lors du téléchargement sur S3:', error);
    throw error;
  }
};

/**
 * Supprime un fichier de S3
 * @param {string} fileUrl - L'URL complète du fichier ou la clé du fichier
 * @returns {Promise<boolean>} - true si la suppression a réussi
 */
const deleteFile = async (fileUrl) => {
  // Extraire la clé du fichier de l'URL ou utiliser directement si c'est une clé
  let key = fileUrl;
  
  if (fileUrl.includes(s3Config.bucket)) {
    // Extraire la clé de l'URL complète
    const urlParts = new URL(fileUrl);
    key = urlParts.pathname.substring(1); // Supprimer le '/' initial
  }
  
  const params = {
    Bucket: s3Config.bucket,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier S3:', error);
    throw error;
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  s3 // Exporter le client S3 pour des opérations avancées
}; 