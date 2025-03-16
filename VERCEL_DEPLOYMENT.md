# Guide de déploiement sur Vercel

## Prérequis
- Un compte Vercel (https://vercel.com)
- Git installé sur votre machine locale
- Le CLI Vercel (optionnel)

## Étapes de configuration

### 1. Configuration des variables d'environnement

Toutes les variables d'environnement dans votre fichier `.env` doivent être configurées dans le projet Vercel. Vous pouvez les ajouter:
- Via l'interface web de Vercel, dans la section "Settings" > "Environment Variables" de votre projet.
- Via le CLI Vercel avec la commande `vercel env add`

Variables d'environnement importantes à configurer:
```
DB_TYPE=mysql
DB_HOST=votre_hote_de_bdd
DB_PORT=votre_port_de_bdd
DB_NAME=votre_nom_de_bdd
DB_USER=votre_utilisateur_de_bdd
DB_PASSWORD=votre_mot_de_passe_de_bdd
DB_SSL=true
JWT_SECRET=votre_secret_jwt
JWT_EXPIRATION=24h
EMAIL_HOST=votre_host_smtp
EMAIL_PORT=votre_port_smtp
EMAIL_USER=votre_utilisateur_smtp
EMAIL_PASS=votre_mot_de_passe_smtp
EMAIL_FROM=votre_email_from
```

### 2. Base de données
- Assurez-vous que votre base de données MySQL est accessible depuis l'extérieur (Vercel doit pouvoir s'y connecter)
- Si vous utilisez Aiven Cloud (comme dans votre configuration), vérifiez que les règles de pare-feu permettent les connexions depuis Vercel

### 3. Fichiers statiques
- Vercel ne gère pas le stockage de fichiers sur son propre système
- Si votre application utilise le dossier `uploads/` pour stocker des fichiers, vous devrez:
  - Migrer vers un service comme AWS S3, Google Cloud Storage ou Cloudinary
  - Modifier votre code pour utiliser ces services de stockage cloud au lieu du système de fichiers local

### 4. Déploiement

#### Via l'interface web
1. Connectez-vous à votre compte Vercel
2. Cliquez sur "New Project"
3. Importez votre dépôt Git
4. Configurez les variables d'environnement
5. Cliquez sur "Deploy"

#### Via le CLI Vercel
1. Installez le CLI Vercel: `npm install -g vercel`
2. Dans le dossier de votre projet, exécutez: `vercel login`
3. Puis déployez avec: `vercel`
4. Suivez les instructions à l'écran

## Notes importantes

### Limites serverless
- Vercel utilise une architecture serverless, ce qui signifie que votre application doit pouvoir démarrer rapidement
- Les connexions à la base de données doivent être optimisées (utilisation de pools)
- Les fonctions longue durée peuvent être interrompues (limite de 10 secondes pour les requêtes sur le plan gratuit)

### Stockage de fichiers
- Modifiez votre application pour utiliser un service de stockage en nuage externe
- Exemple avec AWS S3 ou Cloudinary pour le stockage des fichiers uploadés

### Migrations de base de données
- Les migrations de base de données ne peuvent pas être exécutées automatiquement à chaque déploiement
- Utilisez des outils comme Sequelize CLI pour gérer les migrations manuellement

## Ressources utiles
- [Documentation Vercel pour Node.js](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)
- [Documentation Vercel pour les variables d'environnement](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentation Sequelize](https://sequelize.org/master/) 