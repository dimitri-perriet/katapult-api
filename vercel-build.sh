#!/bin/bash

# Installation explicite de mysql2
echo "Installation explicite du package mysql2..."
npm install mysql2 --no-save

# Installation normale des dépendances
echo "Installation des dépendances du projet..."
npm install

# Vous pouvez ajouter d'autres étapes de build ici si nécessaire

# Fin du script
echo "Script de build terminé avec succès" 