-- Script de mise à jour robuste qui vérifie l'existence des colonnes avant modification
USE katapult_db;

-- Vérifier et gérer la table de sauvegarde existante
DROP TABLE IF EXISTS candidatures_backup;
CREATE TABLE candidatures_backup LIKE candidatures;
INSERT INTO candidatures_backup SELECT * FROM candidatures;

-- Supprimer les colonnes une par une, en vérifiant leur existence d'abord
-- Utiliser des commandes directes avec des sous-requêtes pour vérifier l'existence

-- Supprimer call_source si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'call_source'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN call_source', 
              'SELECT "La colonne call_source n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer call_source_other si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'call_source_other'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN call_source_other', 
              'SELECT "La colonne call_source_other n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer street si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'street'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN street', 
              'SELECT "La colonne street n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer city si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'city'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN city', 
              'SELECT "La colonne city n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer postal_code si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'postal_code'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN postal_code', 
              'SELECT "La colonne postal_code n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer country si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'country'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN country', 
              'SELECT "La colonne country n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer current_situation si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'current_situation'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN current_situation', 
              'SELECT "La colonne current_situation n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer current_situation_other si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'current_situation_other'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN current_situation_other', 
              'SELECT "La colonne current_situation_other n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer project_name si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'project_name'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN project_name', 
              'SELECT "La colonne project_name n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer project_description si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'project_description'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN project_description', 
              'SELECT "La colonne project_description n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer sector si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'sector'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN sector', 
              'SELECT "La colonne sector n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer sector_other si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'sector_other'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN sector_other', 
              'SELECT "La colonne sector_other n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer maturity_level si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'maturity_level'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN maturity_level', 
              'SELECT "La colonne maturity_level n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer start_date si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'start_date'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN start_date', 
              'SELECT "La colonne start_date n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer implementation_area si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'implementation_area'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN implementation_area', 
              'SELECT "La colonne implementation_area n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer intervention_area si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'intervention_area'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN intervention_area', 
              'SELECT "La colonne intervention_area n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer problem_statement si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'problem_statement'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN problem_statement', 
              'SELECT "La colonne problem_statement n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer solution_description si elle existe
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'candidatures' 
    AND COLUMN_NAME = 'solution_description'
);

SET @sql = IF(@column_exists > 0, 
              'ALTER TABLE candidatures DROP COLUMN solution_description', 
              'SELECT "La colonne solution_description n\'existe pas"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Procédure pour ajouter une colonne JSON si elle n'existe pas
DROP PROCEDURE IF EXISTS add_json_column_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_json_column_if_not_exists(IN table_name VARCHAR(255), IN column_name VARCHAR(255), IN after_column VARCHAR(255))
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO column_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = table_name
    AND COLUMN_NAME = column_name;
    
    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', table_name, ' ADD COLUMN ', column_name, ' JSON AFTER ', after_column);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Ajouter les colonnes JSON une par une
CALL add_json_column_if_not_exists('candidatures', 'fiche_identite', 'user_id');
CALL add_json_column_if_not_exists('candidatures', 'projet_utilite_sociale', 'fiche_identite');
CALL add_json_column_if_not_exists('candidatures', 'qui_est_concerne', 'projet_utilite_sociale');
CALL add_json_column_if_not_exists('candidatures', 'modele_economique', 'qui_est_concerne');
CALL add_json_column_if_not_exists('candidatures', 'parties_prenantes', 'modele_economique');
CALL add_json_column_if_not_exists('candidatures', 'equipe_projet', 'parties_prenantes');
CALL add_json_column_if_not_exists('candidatures', 'documents_json', 'equipe_projet');
CALL add_json_column_if_not_exists('candidatures', 'completed_sections', 'documents_json');

-- Procédure pour ajouter une colonne normale
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
    IN table_name VARCHAR(255), 
    IN column_name VARCHAR(255), 
    IN column_definition VARCHAR(255),
    IN after_column VARCHAR(255)
)
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO column_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = table_name
    AND COLUMN_NAME = column_name;
    
    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', table_name, ' ADD COLUMN ', column_name, ' ', column_definition, ' AFTER ', after_column);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Ajouter d'autres colonnes
CALL add_column_if_not_exists('candidatures', 'submission_date', 'DATETIME', 'status');
CALL add_column_if_not_exists('candidatures', 'generated_pdf_url', 'VARCHAR(255)', 'monday_item_id');

-- Migration des données

-- Nous allons vérifier d'abord si les colonnes existent dans la table source et destination
-- avant d'effectuer la mise à jour
DROP PROCEDURE IF EXISTS check_and_update_json_data;
DELIMITER //
CREATE PROCEDURE check_and_update_json_data()
BEGIN
    DECLARE project_name_exists INT DEFAULT 0;
    DECLARE sector_exists INT DEFAULT 0;
    DECLARE implementation_area_exists INT DEFAULT 0;
    DECLARE intervention_area_exists INT DEFAULT 0;
    DECLARE project_description_exists INT DEFAULT 0;
    DECLARE problem_statement_exists INT DEFAULT 0;
    DECLARE solution_description_exists INT DEFAULT 0;
    DECLARE fiche_identite_exists INT DEFAULT 0;
    DECLARE projet_utilite_sociale_exists INT DEFAULT 0;
    DECLARE qui_est_concerne_exists INT DEFAULT 0;
    DECLARE modele_economique_exists INT DEFAULT 0;
    DECLARE parties_prenantes_exists INT DEFAULT 0;
    DECLARE equipe_projet_exists INT DEFAULT 0;
    DECLARE completed_sections_exists INT DEFAULT 0;
    
    -- Vérifier les colonnes source
    SELECT COUNT(*) INTO project_name_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures_backup' AND COLUMN_NAME = 'project_name';
    
    SELECT COUNT(*) INTO sector_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures_backup' AND COLUMN_NAME = 'sector';
    
    SELECT COUNT(*) INTO implementation_area_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures_backup' AND COLUMN_NAME = 'implementation_area';
    
    SELECT COUNT(*) INTO intervention_area_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures_backup' AND COLUMN_NAME = 'intervention_area';
    
    SELECT COUNT(*) INTO project_description_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures_backup' AND COLUMN_NAME = 'project_description';
    
    SELECT COUNT(*) INTO problem_statement_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures_backup' AND COLUMN_NAME = 'problem_statement';
    
    SELECT COUNT(*) INTO solution_description_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures_backup' AND COLUMN_NAME = 'solution_description';
    
    -- Vérifier les colonnes destination
    SELECT COUNT(*) INTO fiche_identite_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures' AND COLUMN_NAME = 'fiche_identite';
    
    SELECT COUNT(*) INTO projet_utilite_sociale_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures' AND COLUMN_NAME = 'projet_utilite_sociale';
    
    SELECT COUNT(*) INTO qui_est_concerne_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures' AND COLUMN_NAME = 'qui_est_concerne';
    
    SELECT COUNT(*) INTO modele_economique_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures' AND COLUMN_NAME = 'modele_economique';
    
    SELECT COUNT(*) INTO parties_prenantes_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures' AND COLUMN_NAME = 'parties_prenantes';
    
    SELECT COUNT(*) INTO equipe_projet_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures' AND COLUMN_NAME = 'equipe_projet';
    
    SELECT COUNT(*) INTO completed_sections_exists FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidatures' AND COLUMN_NAME = 'completed_sections';
    
    -- Si toutes les colonnes nécessaires existent, effectuer la mise à jour
    IF fiche_identite_exists > 0 AND project_name_exists > 0 AND sector_exists > 0 
       AND implementation_area_exists > 0 AND intervention_area_exists > 0 THEN
        
        UPDATE candidatures c
        JOIN candidatures_backup b ON c.id = b.id
        SET c.fiche_identite = JSON_OBJECT(
            'projectName', b.project_name,
            'sector', b.sector,
            'territory', b.implementation_area,
            'interventionZone', b.intervention_area,
            'referral', JSON_OBJECT(
                'boucheOreille', FALSE,
                'facebook', FALSE,
                'linkedin', FALSE,
                'web', FALSE,
                'tiers', FALSE,
                'presse', FALSE
            )
        );
    END IF;
    
    IF projet_utilite_sociale_exists > 0 AND project_description_exists > 0 AND problem_statement_exists > 0 THEN
        UPDATE candidatures c
        JOIN candidatures_backup b ON c.id = b.id
        SET c.projet_utilite_sociale = JSON_OBJECT(
            'projectGenesis', 'À renseigner',
            'projectSummary', b.project_description,
            'problemDescription', b.problem_statement
        );
    END IF;
    
    IF qui_est_concerne_exists > 0 AND solution_description_exists > 0 THEN
        UPDATE candidatures c
        JOIN candidatures_backup b ON c.id = b.id
        SET c.qui_est_concerne = JSON_OBJECT(
            'beneficiaries', 'À renseigner',
            'clients', 'À renseigner',
            'clientsQuantification', 'À renseigner',
            'proposedSolution', b.solution_description,
            'projectDifferentiation', 'À renseigner',
            'indicator1', 'À renseigner',
            'indicator2', 'À renseigner',
            'indicator3', 'À renseigner',
            'indicator4', 'À renseigner',
            'indicator5', 'À renseigner'
        );
    END IF;
    
    IF modele_economique_exists > 0 THEN
        UPDATE candidatures c
        JOIN candidatures_backup b ON c.id = b.id
        SET c.modele_economique = JSON_OBJECT(
            'revenueSources', 'À renseigner',
            'employmentCreation', 'À renseigner',
            'economicViability', 'À renseigner',
            'diversification', 'À renseigner'
        );
    END IF;
    
    IF parties_prenantes_exists > 0 THEN
        UPDATE candidatures c
        JOIN candidatures_backup b ON c.id = b.id
        SET c.parties_prenantes = JSON_OBJECT(
            'existingPartnerships', 'À renseigner',
            'desiredPartnerships', 'À renseigner',
            'stakeholderRole', 'À renseigner'
        );
    END IF;
    
    IF equipe_projet_exists > 0 THEN
        UPDATE candidatures c
        JOIN candidatures_backup b ON c.id = b.id
        SET c.equipe_projet = JSON_OBJECT(
            'reference', JSON_OBJECT(
                'lastName', '',
                'firstName', '',
                'DOB', NULL,
                'address', '',
                'email', '',
                'telephone', '',
                'employmentType', 'salarié',
                'employmentDuration', ''
            ),
            'members', JSON_ARRAY(),
            'entrepreneurialExperience', '',
            'inspiringEntrepreneur', '',
            'missingTeamSkills', '',
            'incubationParticipants', '',
            'projectRoleLongTerm', ''
        );
    END IF;
    
    IF completed_sections_exists > 0 THEN
        UPDATE candidatures c
        JOIN candidatures_backup b ON c.id = b.id
        SET c.completed_sections = JSON_OBJECT(
            'ficheIdentite', FALSE,
            'projetUtiliteSociale', FALSE,
            'quiEstConcerne', FALSE,
            'modeleEconomique', FALSE,
            'partiesPrenantes', FALSE,
            'equipeProjet', FALSE,
            'documents', FALSE
        );
    END IF;
END //
DELIMITER ;

-- Exécuter la procédure de migration de données
CALL check_and_update_json_data();

-- Mettre à jour la table project_teams pour l'aligner avec la nouvelle structure
-- Vérifier si ces colonnes existent déjà pour éviter les erreurs
DROP PROCEDURE IF EXISTS update_project_teams;
DELIMITER //
CREATE PROCEDURE update_project_teams()
BEGIN
    DECLARE name_exists INT DEFAULT 0;
    DECLARE role_exists INT DEFAULT 0;
    DECLARE member_expertise_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO name_exists
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'project_teams' 
    AND COLUMN_NAME = 'name';
    
    SELECT COUNT(*) INTO role_exists
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'project_teams' 
    AND COLUMN_NAME = 'role';
    
    SELECT COUNT(*) INTO member_expertise_exists
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'project_teams' 
    AND COLUMN_NAME = 'member_expertise';
    
    IF name_exists > 0 THEN
        ALTER TABLE project_teams CHANGE COLUMN name member_name VARCHAR(255) NOT NULL;
    END IF;
    
    IF role_exists > 0 THEN
        ALTER TABLE project_teams CHANGE COLUMN role member_role VARCHAR(255) NOT NULL;
    END IF;
    
    IF member_expertise_exists = 0 THEN
        ALTER TABLE project_teams ADD COLUMN member_expertise TEXT AFTER member_role;
    END IF;
END //
DELIMITER ;

-- Exécuter la procédure de mise à jour des project_teams
CALL update_project_teams();

-- Création d'index pour améliorer les performances
DROP PROCEDURE IF EXISTS create_indexes_if_not_exist;
DELIMITER //
CREATE PROCEDURE create_indexes_if_not_exist()
BEGIN
    DECLARE status_index_exists INT DEFAULT 0;
    DECLARE user_index_exists INT DEFAULT 0;
    DECLARE submission_index_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO status_index_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'candidatures'
    AND INDEX_NAME = 'idx_candidature_status';
    
    SELECT COUNT(*) INTO user_index_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'candidatures'
    AND INDEX_NAME = 'idx_candidature_user';
    
    SELECT COUNT(*) INTO submission_index_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'candidatures'
    AND INDEX_NAME = 'idx_candidature_submission_date';
    
    IF status_index_exists = 0 THEN
        ALTER TABLE candidatures ADD INDEX idx_candidature_status (status);
    END IF;
    
    IF user_index_exists = 0 THEN
        ALTER TABLE candidatures ADD INDEX idx_candidature_user (user_id);
    END IF;
    
    IF submission_index_exists = 0 THEN
        ALTER TABLE candidatures ADD INDEX idx_candidature_submission_date (submission_date);
    END IF;
END //
DELIMITER ;

-- Exécuter la procédure de création d'index
CALL create_indexes_if_not_exist();

-- Nettoyage des procédures temporaires
DROP PROCEDURE IF EXISTS add_json_column_if_not_exists;
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DROP PROCEDURE IF EXISTS check_and_update_json_data;
DROP PROCEDURE IF EXISTS update_project_teams;
DROP PROCEDURE IF EXISTS create_indexes_if_not_exist; 