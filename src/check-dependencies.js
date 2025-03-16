// Script pour vérifier et installer les dépendances manquantes
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Vérification des dépendances...');

// Fonction pour vérifier si mysql2 est installé
function checkMysql2() {
  try {
    require.resolve('mysql2');
    console.log('mysql2 est déjà installé.');
    return true;
  } catch (e) {
    console.log('mysql2 n\'est pas installé. Installation en cours...');
    return false;
  }
}

// Installation de mysql2 si nécessaire
if (!checkMysql2()) {
  try {
    console.log('Tentative d\'installation de mysql2...');
    execSync('npm install mysql2 --no-save', { stdio: 'inherit' });
    console.log('mysql2 a été installé avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'installation de mysql2:', error);
    process.exit(1);
  }
}

// Vérification après installation
if (!checkMysql2()) {
  console.error('Échec de l\'installation de mysql2. Veuillez l\'installer manuellement.');
  process.exit(1);
}

console.log('Toutes les dépendances sont correctement installées.'); 