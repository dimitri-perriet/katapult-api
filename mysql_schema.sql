-- Script de création de la base de données Katapult avec la nouvelle structure
-- MySQL

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS katapult_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE katapult_db;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('candidat', 'evaluateur', 'admin') DEFAULT 'candidat',
    is_active BOOLEAN DEFAULT TRUE,
    profile_picture VARCHAR(255),
    last_login DATETIME,
    password_changed_at DATETIME,
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME,
    phone VARCHAR(20),
    street VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'France',
    notification_email BOOLEAN DEFAULT TRUE,
    notification_app BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- Table des candidatures avec nouvelle structure JSON
CREATE TABLE IF NOT EXISTS candidatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    promotion VARCHAR(100) NOT NULL,
    -- Nouvelles colonnes JSON remplaçant les anciennes colonnes
    fiche_identite JSON,
    projet_utilite_sociale JSON,
    qui_est_concerne JSON,
    modele_economique JSON,
    parties_prenantes JSON,
    equipe_projet JSON,
    documents_json JSON,
    completed_sections JSON,
    status ENUM('brouillon', 'soumise', 'en_evaluation', 'acceptee', 'rejetee') DEFAULT 'brouillon',
    submission_date DATETIME,
    monday_item_id VARCHAR(255),
    generated_pdf_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_candidature_status (status),
    INDEX idx_candidature_user (user_id),
    INDEX idx_candidature_submission_date (submission_date),
    INDEX idx_promotion (promotion)
) ENGINE=InnoDB;

-- Table des équipes projet avec structure mise à jour
CREATE TABLE IF NOT EXISTS project_teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidature_id INT NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    member_role VARCHAR(255) NOT NULL,
    member_expertise TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidature_id) REFERENCES candidatures(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table des documents
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidature_id INT NOT NULL,
    document_type ENUM('business_plan', 'cv', 'presentation', 'autre') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidature_id) REFERENCES candidatures(id) ON DELETE CASCADE,
    INDEX idx_document_type (document_type)
) ENGINE=InnoDB;

-- Table des évaluations
CREATE TABLE IF NOT EXISTS evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidature_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    innovation_score TINYINT NOT NULL CHECK (innovation_score BETWEEN 0 AND 5),
    innovation_comment TEXT,
    viability_score TINYINT NOT NULL CHECK (viability_score BETWEEN 0 AND 5),
    viability_comment TEXT,
    impact_score TINYINT NOT NULL CHECK (impact_score BETWEEN 0 AND 5),
    impact_comment TEXT,
    team_score TINYINT NOT NULL CHECK (team_score BETWEEN 0 AND 5),
    team_comment TEXT,
    alignment_score TINYINT NOT NULL CHECK (alignment_score BETWEEN 0 AND 5),
    alignment_comment TEXT,
    general_comment TEXT,
    recommendation ENUM('accepter', 'rejeter', 'à_discuter') NOT NULL,
    status ENUM('en_cours', 'terminée') DEFAULT 'en_cours',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidature_id) REFERENCES candidatures(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_candidature_evaluator (candidature_id, evaluator_id)
) ENGINE=InnoDB;

-- Table d'accès aux candidatures
CREATE TABLE IF NOT EXISTS candidature_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    candidature_id INT NOT NULL,
    access_level ENUM('read', 'write', 'admin') DEFAULT 'read',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (candidature_id) REFERENCES candidatures(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_candidature (user_id, candidature_id)
) ENGINE=InnoDB;

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB; 