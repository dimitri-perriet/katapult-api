const jwt = require('jsonwebtoken');
const db = require('../../models');

// Middleware pour vérifier le JWT et authentifier l'utilisateur
exports.authenticateJWT = async (req, res, next) => {
  try {
    // Récupérer le token du header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Aucun token fourni',
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await db.User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Utilisateur non trouvé',
      });
    }
    
    // Vérifier si l'utilisateur est actif
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Compte désactivé',
      });
    }
    
    // Vérifier si le mot de passe a été changé après l'émission du token
    if (user.password_changed_at) {
      const changedTimestamp = parseInt(user.password_changed_at.getTime() / 1000, 10);
      
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          success: false,
          message: 'Accès non autorisé. Veuillez vous reconnecter',
        });
      }
    }
    
    // Ajouter l'utilisateur à la requête
    req.user = { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token invalide',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token expiré',
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification',
      error: error.message,
    });
  }
};

// Middleware pour autoriser certains rôles
exports.authorizeRoles = (roles) => {
  return async (req, res, next) => {
    try {
      // Récupérer le rôle de l'utilisateur à partir de la base de données pour être sûr qu'il est à jour
      const user = await db.User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Accès non autorisé. Utilisateur non trouvé',
        });
      }
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Accès interdit. Vous n\'avez pas les permissions nécessaires',
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur d\'autorisation',
        error: error.message,
      });
    }
  };
}; 