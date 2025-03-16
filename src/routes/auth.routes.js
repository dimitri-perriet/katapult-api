const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Routes protégées
router.use(protect);
router.get('/me', authController.getMe);
router.put('/update-details', authController.updateDetails);
router.put('/update-password', authController.updatePassword);
router.post('/logout', authController.logout);

module.exports = router;