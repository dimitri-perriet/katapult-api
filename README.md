# Katapult API

API backend pour la plateforme de gestion des candidatures Katapult, un outil dédié aux incubateurs et accélérateurs de l'Économie Sociale et Solidaire (ESS).

## Fonctionnalités

- Gestion des utilisateurs (administrateurs, évaluateurs, candidats)
- Gestion des candidatures
- Système d'évaluation des projets
- Intégration avec Monday.com
- Génération de PDF
- Envoi d'emails automatisés

## Prérequis

- Node.js (v14 ou supérieur)
- MongoDB (v4.4 ou supérieur)
- Compte Monday.com (pour l'intégration)

## Installation

1. Cloner le dépôt
```bash
git clone https://github.com/votre-organisation/katapult-api.git
cd katapult-api
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Modifier le fichier .env avec vos propres valeurs
```

4. Démarrer le serveur en mode développement
```bash
npm run dev
```

## Structure du projet

```
katapult-api/
├── src/
│   ├── controllers/     # Contrôleurs pour chaque ressource
│   ├── middlewares/     # Middlewares personnalisés
│   ├── models/          # Modèles Mongoose
│   ├── routes/          # Définition des routes
│   ├── services/        # Services métier
│   ├── utils/           # Utilitaires
│   ├── app.js           # Configuration de l'application Express
│   └── server.js        # Point d'entrée de l'application
├── .env                 # Variables d'environnement
├── .gitignore           # Fichiers ignorés par Git
├── package.json         # Dépendances et scripts
└── README.md            # Documentation
```

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/forgot-password` - Demande de réinitialisation de mot de passe
- `POST /api/auth/reset-password` - Réinitialisation du mot de passe

### Utilisateurs
- `GET /api/users/profile` - Récupérer le profil de l'utilisateur connecté
- `PUT /api/users/profile` - Mettre à jour le profil de l'utilisateur connecté
- `PUT /api/users/change-password` - Changer le mot de passe
- `GET /api/users` - Récupérer tous les utilisateurs (admin)
- `GET /api/users/:id` - Récupérer un utilisateur par ID
- `POST /api/users` - Créer un nouvel utilisateur (admin)
- `PUT /api/users/:id` - Mettre à jour un utilisateur (admin)
- `DELETE /api/users/:id` - Supprimer un utilisateur (admin)

### Candidatures
- `GET /api/candidatures` - Récupérer toutes les candidatures
- `GET /api/candidatures/:id` - Récupérer une candidature par ID
- `POST /api/candidatures` - Créer une nouvelle candidature
- `PUT /api/candidatures/:id` - Mettre à jour une candidature
- `DELETE /api/candidatures/:id` - Supprimer une candidature
- `GET /api/candidatures/:id/pdf` - Générer un PDF de la candidature

### Évaluations
- `GET /api/evaluations` - Récupérer toutes les évaluations
- `GET /api/evaluations/:id` - Récupérer une évaluation par ID
- `POST /api/evaluations` - Créer une nouvelle évaluation
- `PUT /api/evaluations/:id` - Mettre à jour une évaluation
- `DELETE /api/evaluations/:id` - Supprimer une évaluation

### Monday.com
- `POST /api/monday/sync-candidature/:id` - Synchroniser une candidature avec Monday
- `POST /api/monday/sync-all` - Synchroniser toutes les candidatures avec Monday
- `GET /api/monday/boards` - Récupérer les tableaux Monday
- `GET /api/monday/boards/:id/columns` - Récupérer les colonnes d'un tableau Monday
- `POST /api/monday/webhook` - Configurer un webhook Monday
- `GET /api/monday/status` - Vérifier le statut de connexion à Monday

## Licence

ISC 