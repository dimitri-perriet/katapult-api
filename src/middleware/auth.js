const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');

// Middleware pour protéger les routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier si le header d'autorisation est présent et commence par "Bearer"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Récupérer le token du header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Si pas de header, vérifier les cookies
      token = req.cookies.token;
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Veuillez vous connecter.',
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Vérifier si l'utilisateur existe toujours en utilisant le service
      const user = await userService.getUserById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'L\'utilisateur associé à ce token n\'existe plus.',
        });
      }

      // Vérifier si le mot de passe a été changé après l'émission du token
      if (user.password_changed_at && new Date(user.password_changed_at).getTime() / 1000 > decoded.iat) {
        return res.status(401).json({
          success: false,
          message: 'Le mot de passe a été modifié récemment. Veuillez vous reconnecter.',
        });
      }

      // Ajouter l'utilisateur à la requête
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré.',
        error: error.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'authentification.',
      error: error.message,
    });
  }
};

// Middleware pour autoriser certains rôles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource.`,
      });
    }

    next();
  };
}; 