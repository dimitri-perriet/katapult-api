-- Script de mise à jour de la table candidatures (version robuste)
USE katapult_db;

-- Vérifier et gérer la table de sauvegarde existante
DROP TABLE IF EXISTS candidatures_backup;
CREATE TABLE candidatures_backup LIKE candidatures;
INSERT INTO candidatures_backup SELECT * FROM candidatures;

-- Ajout des nouvelles colonnes JSON pour stocker les structures imbriquées
ALTER TABLE candidatures
    -- Suppression des colonnes qui seront remplacées par les structures JSON
    DROP COLUMN call_source,
    DROP COLUMN call_source_other,
    DROP COLUMN street,
    DROP COLUMN city,
    DROP COLUMN postal_code,
    DROP COLUMN country,
    DROP COLUMN current_situation,
    DROP COLUMN current_situation_other,
    DROP COLUMN project_name,
    DROP COLUMN project_description,
    DROP COLUMN sector,
    DROP COLUMN sector_other,
    DROP COLUMN maturity_level,
    DROP COLUMN start_date,
    DROP COLUMN implementation_area,
    DROP COLUMN intervention_area,
    DROP COLUMN problem_statement,
    DROP COLUMN solution_description,
    
    -- Ajout des nouvelles colonnes JSON pour les sections
    ADD COLUMN fiche_identite JSON AFTER user_id,
    ADD COLUMN projet_utilite_sociale JSON AFTER fiche_identite,
    ADD COLUMN qui_est_concerne JSON AFTER projet_utilite_sociale,
    ADD COLUMN modele_economique JSON AFTER qui_est_concerne,
    ADD COLUMN parties_prenantes JSON AFTER modele_economique,
    ADD COLUMN equipe_projet JSON AFTER parties_prenantes,
    ADD COLUMN documents_json JSON AFTER equipe_projet,
    ADD COLUMN completed_sections JSON AFTER documents_json,
    ADD COLUMN submission_date DATETIME AFTER status,
    ADD COLUMN generated_pdf_url VARCHAR(255) AFTER monday_item_id;

-- Migration des données existantes
UPDATE candidatures c
JOIN candidatures_backup b ON c.id = b.id
SET 
    c.fiche_identite = JSON_OBJECT(
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
    ),
    c.projet_utilite_sociale = JSON_OBJECT(
        'projectGenesis', 'À renseigner',
        'projectSummary', b.project_description,
        'problemDescription', b.problem_statement
    ),
    c.qui_est_concerne = JSON_OBJECT(
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
    ),
    c.modele_economique = JSON_OBJECT(
        'revenueSources', 'À renseigner',
        'employmentCreation', 'À renseigner',
        'economicViability', 'À renseigner',
        'diversification', 'À renseigner'
    ),
    c.parties_prenantes = JSON_OBJECT(
        'existingPartnerships', 'À renseigner',
        'desiredPartnerships', 'À renseigner',
        'stakeholderRole', 'À renseigner'
    ),
    c.equipe_projet = JSON_OBJECT(
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
    ),
    c.completed_sections = JSON_OBJECT(
        'ficheIdentite', FALSE,
        'projetUtiliteSociale', FALSE,
        'quiEstConcerne', FALSE,
        'modeleEconomique', FALSE,
        'partiesPrenantes', FALSE,
        'equipeProjet', FALSE,
        'documents', FALSE
    );

-- Mettre à jour la table project_teams pour l'aligner avec la nouvelle structure
-- Vérifier si ces colonnes existent déjà pour éviter les erreurs
-- Ces instructions peuvent échouer si les colonnes ont déjà été renommées ou n'existent pas
-- Nous utilisons des instructions conditionnelles pour plus de robustesse
SET @stmtCheck = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'katapult_db' 
    AND TABLE_NAME = 'project_teams' 
    AND COLUMN_NAME = 'name'
);

SET @sql = CONCAT(
    IF(@stmtCheck > 0, 'ALTER TABLE project_teams RENAME COLUMN name TO member_name;', 'SELECT 1;')
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmtCheck = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'katapult_db' 
    AND TABLE_NAME = 'project_teams' 
    AND COLUMN_NAME = 'role'
);

SET @sql = CONCAT(
    IF(@stmtCheck > 0, 'ALTER TABLE project_teams RENAME COLUMN role TO member_role;', 'SELECT 1;')
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifie si la colonne member_expertise existe, si non la crée
SET @stmtCheck = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'katapult_db' 
    AND TABLE_NAME = 'project_teams' 
    AND COLUMN_NAME = 'member_expertise'
);

SET @sql = CONCAT(
    IF(@stmtCheck = 0, 'ALTER TABLE project_teams ADD COLUMN member_expertise TEXT AFTER member_role;', 'SELECT 1;')
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Création d'index pour améliorer les performances (ignore si l'index existe déjà)
ALTER TABLE candidatures ADD INDEX IF NOT EXISTS idx_candidature_status (status);
ALTER TABLE candidatures ADD INDEX IF NOT EXISTS idx_candidature_user (user_id);
ALTER TABLE candidatures ADD INDEX IF NOT EXISTS idx_candidature_submission_date (submission_date); 