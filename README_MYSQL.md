# Configuration de la base de données MySQL pour Katapult API

Ce document explique comment configurer et utiliser la base de données MySQL pour l'application Katapult API.

## Prérequis

- MySQL Server 8.0+ installé
- Accès avec privilèges administratifs à MySQL

## Étapes d'installation

### 1. Installation de MySQL (si non installé)

#### Sur macOS (avec Homebrew)
```bash
brew install mysql
brew services start mysql
```

#### Sur Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Sur Windows
Téléchargez et installez MySQL depuis [le site officiel](https://dev.mysql.com/downloads/installer/).

### 2. Sécurisation de l'installation MySQL
```bash
sudo mysql_secure_installation
```

### 3. Création de l'utilisateur et de la base de données

Connectez-vous à MySQL en tant qu'administrateur :
```bash
mysql -u root -p
```

Créez un utilisateur dédié et accordez-lui les privilèges sur la base de données :
```sql
CREATE USER 'katapult_user'@'localhost' IDENTIFIED BY 'tprezo89000';
GRANT ALL PRIVILEGES ON katapult_db.* TO 'katapult_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Importation du schéma de la base de données

Importez le schéma SQL fourni :
```bash
mysql -u katapult_user -p < mysql_schema.sql
```

## Configuration de l'application

### 1. Modifier le fichier .env

Mettez à jour le fichier `.env` pour utiliser MySQL au lieu de MongoDB :

```
# Configuration de la base de données
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=katapult_db
DB_USER=katapult_user
DB_PASSWORD=votre_mot_de_passe_securise
```

### 2. Installation des dépendances MySQL pour Node.js

```bash
npm install mysql2 sequelize sequelize-cli
```

### 3. Initialisation du projet Sequelize

```bash
npx sequelize-cli init
```

## Migration depuis MongoDB

Pour migrer les données existantes de MongoDB vers MySQL, il faudra :

1. Créer un script de migration qui lit les données de MongoDB
2. Transformer ces données au format MySQL
3. Insérer les données dans la nouvelle base MySQL

Exemple de script de migration (à adapter) :

```javascript
// migration-script.js
require('dotenv').config();
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const UserModel = require('./src/models/user.model');
// Importer d'autres modèles MongoDB selon besoin

// Configuration Sequelize pour MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

// Modèles Sequelize (à créer)
const { User } = require('./models');

async function migrateData() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    // Connexion à MySQL
    await sequelize.authenticate();
    console.log('Connecté à MySQL');

    // Migration des utilisateurs
    const users = await UserModel.find({});
    console.log(`Trouvé ${users.length} utilisateurs à migrer`);

    for (const user of users) {
      await User.create({
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        password: user.password,
        role: user.role,
        // ... autres champs
      });
    }

    console.log('Migration terminée avec succès');
  } catch (error) {
    console.error('Erreur de migration:', error);
  } finally {
    mongoose.disconnect();
    await sequelize.close();
  }
}

migrateData();
```

## Maintenance et sauvegardes

### Sauvegarde de la base de données
```bash
mysqldump -u katapult_user -p katapult_db > backup_$(date +%Y%m%d).sql
```

### Restauration d'une sauvegarde
```bash
mysql -u katapult_user -p katapult_db < backup_YYYYMMDD.sql
```

## Connexion depuis MySQL CLI
```bash
mysql -u katapult_user -p katapult_db
```

## Ressources utiles

- [Documentation MySQL](https://dev.mysql.com/doc/)
- [Documentation Sequelize](https://sequelize.org/master/)
- [Tutoriels MySQL avec Node.js](https://www.mysqltutorial.org/mysql-nodejs/) 