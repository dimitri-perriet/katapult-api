/**
 * Script pour générer un secret JWT sécurisé
 * 
 * Utilisation: 
 * node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

// Générer un secret JWT aléatoire de 64 caractères hexadécimaux
const generateJwtSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

const secret = generateJwtSecret();

console.log('\n=== SECRET JWT GÉNÉRÉ ===');
console.log(secret);
console.log('\nCopiez cette valeur dans votre fichier .env pour la variable JWT_SECRET');
console.log('=========================\n');