-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : jeu. 24 avr. 2025 à 10:06
-- Version du serveur : 11.4.5-MariaDB
-- Version de PHP : 8.3.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `sc1padu1468_katapult_db`
--
CREATE DATABASE IF NOT EXISTS `sc1padu1468_katapult_db` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `sc1padu1468_katapult_db`;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('candidat','evaluateur','admin') DEFAULT 'candidat',
  `is_active` tinyint(1) DEFAULT 1,
  `profile_picture` varchar(255) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'France',
  `notification_email` tinyint(1) DEFAULT 1,
  `notification_app` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `role`, `is_active`, `profile_picture`, `last_login`, `password_changed_at`, `password_reset_token`, `password_reset_expires`, `phone`, `street`, `city`, `postal_code`, `country`, `notification_email`, `notification_app`, `created_at`, `updated_at`) VALUES
(1, 'Dimitri', 'Perriet', 'dimitri@perriet.fr', '$2a$10$srP30gwX2LsBQOOfsJTBE.3aCVIkwUysSWj1t6iTn9l54k4Kijaq6', 'candidat', 1, NULL, '2025-03-20 15:39:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'France', 1, 1, '2025-03-17 15:28:05', '2025-03-20 15:39:03'),
(2, 'Julien', 'Arcioni', 'julien.arcioni@my-digital-school.org', '$2a$10$JMyAzShceneOOeJ6OBqGBewO4sbxpSookXEzM/K63wjV0syjavni6', 'candidat', 1, NULL, '2025-03-17 18:23:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'France', 1, 1, '2025-03-17 18:23:28', '2025-03-17 18:23:53'),
(3, 'Elisa ', 'TOFONI', 'e.tofoni@adress-normandie.org', '$2a$10$XP8VfVyHLZxixZOslvFOmuxaX7zvGmI4jB2.MdFP5DtpdYF0UMabS', 'candidat', 1, NULL, '2025-03-20 14:16:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'France', 1, 1, '2025-03-20 11:49:32', '2025-03-20 14:16:12');

-- --------------------------------------------------------

--
-- Structure de la table `candidatures`
--

DROP TABLE IF EXISTS `candidatures`;
CREATE TABLE `candidatures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `fiche_identite` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`fiche_identite`)),
  `projet_utilite_sociale` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`projet_utilite_sociale`)),
  `qui_est_concerne` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`qui_est_concerne`)),
  `modele_economique` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`modele_economique`)),
  `parties_prenantes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parties_prenantes`)),
  `equipe_projet` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`equipe_projet`)),
  `structure_juridique` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`structure_juridique`)), -- Added to match JSON
  `etat_avancement` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`etat_avancement`)), -- New column
  `documents_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents_json`)), -- Kept to store the new 'documents' structure
  `completion_percentage` int(11) DEFAULT 0, -- New column
  `promotion` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL, -- Modified to allow NULL if not initially provided
  `status` enum('brouillon','soumise','en_evaluation','acceptee','rejetee') DEFAULT 'brouillon',
  `submission_date` datetime DEFAULT NULL,
  `monday_item_id` varchar(255) DEFAULT NULL,
  `generated_pdf_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_candidature_status` (`status`),
  KEY `idx_candidature_submission_date` (`submission_date`),
  KEY `idx_candidature_user` (`user_id`),
  KEY `idx_promotion` (`promotion`),
  KEY `idx_status` (`status`),
  CONSTRAINT `candidatures_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `candidatures_backup`
--

DROP TABLE IF EXISTS `candidatures_backup`;
CREATE TABLE `candidatures_backup` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `fiche_identite` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`fiche_identite`)),
  `projet_utilite_sociale` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`projet_utilite_sociale`)),
  `qui_est_concerne` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`qui_est_concerne`)),
  `modele_economique` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`modele_economique`)),
  `parties_prenantes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parties_prenantes`)),
  `equipe_projet` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`equipe_projet`)),
  `documents_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents_json`)),
  `completed_sections` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`completed_sections`)),
  `promotion` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `status` enum('brouillon','soumise','en_evaluation','acceptee','rejetee') DEFAULT 'brouillon',
  `submission_date` datetime DEFAULT NULL,
  `monday_item_id` varchar(255) DEFAULT NULL,
  `generated_pdf_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_promotion` (`promotion`),
  KEY `idx_status` (`status`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `candidature_access`
--

DROP TABLE IF EXISTS `candidature_access`;
CREATE TABLE `candidature_access` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `candidature_id` int(11) NOT NULL,
  `access_level` enum('read','write','admin') DEFAULT 'read',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_candidature` (`user_id`,`candidature_id`),
  KEY `candidature_id` (`candidature_id`),
  CONSTRAINT `candidature_access_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `candidature_access_ibfk_2` FOREIGN KEY (`candidature_id`) REFERENCES `candidatures` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `documents`
--

DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidature_id` int(11) NOT NULL,
  `document_type` enum('business_plan','cv','presentation','autre') NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` int(11) NOT NULL,
  `upload_date` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `candidature_id` (`candidature_id`),
  KEY `idx_document_type` (`document_type`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`candidature_id`) REFERENCES `candidatures` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `evaluations`
--

DROP TABLE IF EXISTS `evaluations`;
CREATE TABLE `evaluations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidature_id` int(11) NOT NULL,
  `evaluator_id` int(11) NOT NULL,
  `innovation_score` tinyint(4) NOT NULL,
  `innovation_comment` text DEFAULT NULL,
  `viability_score` tinyint(4) NOT NULL,
  `viability_comment` text DEFAULT NULL,
  `impact_score` tinyint(4) NOT NULL,
  `impact_comment` text DEFAULT NULL,
  `team_score` tinyint(4) NOT NULL,
  `team_comment` text DEFAULT NULL,
  `alignment_score` tinyint(4) NOT NULL,
  `alignment_comment` text DEFAULT NULL,
  `general_comment` text DEFAULT NULL,
  `recommendation` enum('accepter','rejeter','à_discuter') NOT NULL,
  `status` enum('en_cours','terminée') DEFAULT 'en_cours',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `evaluator_id` (`evaluator_id`),
  KEY `idx_candidature_evaluator` (`candidature_id`,`evaluator_id`),
  CONSTRAINT `evaluations_ibfk_1` FOREIGN KEY (`candidature_id`) REFERENCES `candidatures` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluations_ibfk_2` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `project_teams`
--

DROP TABLE IF EXISTS `project_teams`;
CREATE TABLE `project_teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidature_id` int(11) NOT NULL,
  `member_name` varchar(255) NOT NULL,
  `member_role` varchar(255) NOT NULL,
  `member_expertise` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `candidature_id` (`candidature_id`),
  CONSTRAINT `project_teams_ibfk_1` FOREIGN KEY (`candidature_id`) REFERENCES `candidatures` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
