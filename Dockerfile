FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application
COPY . .

# Exposer le port sur lequel l'API va tourner
EXPOSE 3000

# Commande pour démarrer l'API
CMD ["npm", "run", "dev"]