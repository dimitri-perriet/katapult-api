-- Script de mise à jour de la table candidatures
USE katapult_db;

-- Sauvegarde de la table existante
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

-- Migration des données existantes (script à adapter selon les données)
-- Ce script est un exemple, il faudra l'adapter selon les données existantes
/*
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
*/

-- Création d'un nouveau modèle de migration pour les données
-- Ce fichier sera utilisé comme point de départ pour migrer les données

-- Définir le nouveau délimiteur
DELIMITER //

-- Créer la procédure
CREATE PROCEDURE generate_migration_data()
BEGIN
    SELECT 
        id, 
        user_id,
        JSON_OBJECT(
            'projectName', project_name,
            'sector', sector,
            'territory', implementation_area,
            'interventionZone', intervention_area,
            'referral', JSON_OBJECT(
                'boucheOreille', FALSE,
                'facebook', FALSE,
                'linkedin', FALSE,
                'web', FALSE,
                'tiers', FALSE,
                'presse', FALSE
            )
        ) AS fiche_identite,
        JSON_OBJECT(
            'projectGenesis', 'À renseigner',
            'projectSummary', project_description,
            'problemDescription', problem_statement
        ) AS projet_utilite_sociale,
        JSON_OBJECT(
            'beneficiaries', 'À renseigner',
            'clients', 'À renseigner',
            'clientsQuantification', 'À renseigner',
            'proposedSolution', solution_description,
            'projectDifferentiation', 'À renseigner',
            'indicator1', 'À renseigner',
            'indicator2', 'À renseigner',
            'indicator3', 'À renseigner',
            'indicator4', 'À renseigner',
            'indicator5', 'À renseigner'
        ) AS qui_est_concerne,
        JSON_OBJECT(
            'revenueSources', 'À renseigner',
            'employmentCreation', 'À renseigner',
            'economicViability', 'À renseigner',
            'diversification', 'À renseigner'
        ) AS modele_economique,
        JSON_OBJECT(
            'existingPartnerships', 'À renseigner',
            'desiredPartnerships', 'À renseigner',
            'stakeholderRole', 'À renseigner'
        ) AS parties_prenantes,
        JSON_OBJECT(
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
        ) AS equipe_projet,
        JSON_OBJECT(
            'ficheIdentite', FALSE,
            'projetUtiliteSociale', FALSE,
            'quiEstConcerne', FALSE,
            'modeleEconomique', FALSE,
            'partiesPrenantes', FALSE,
            'equipeProjet', FALSE,
            'documents', FALSE
        ) AS completed_sections
    FROM candidatures_backup
    INTO OUTFILE '/tmp/candidatures_migration_data.csv'
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\n';
END //

-- Rétablir le délimiteur par défaut
DELIMITER ;

-- Exécuter la procédure (décommenter pour utiliser)
-- CALL generate_migration_data();
-- DROP PROCEDURE generate_migration_data;

-- Adapter le modèle Sequelize
/*
const candidatureSchema = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  promotion: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  fiche_identite: {
    type: DataTypes.JSON,
    allowNull: true
  },
  projet_utilite_sociale: {
    type: DataTypes.JSON,
    allowNull: true
  },
  qui_est_concerne: {
    type: DataTypes.JSON,
    allowNull: true
  },
  modele_economique: {
    type: DataTypes.JSON,
    allowNull: true
  },
  parties_prenantes: {
    type: DataTypes.JSON,
    allowNull: true
  },
  equipe_projet: {
    type: DataTypes.JSON,
    allowNull: true
  },
  documents_json: {
    type: DataTypes.JSON,
    allowNull: true
  },
  completed_sections: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('brouillon', 'soumise', 'en_evaluation', 'acceptee', 'rejetee'),
    defaultValue: 'brouillon'
  },
  submission_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  monday_item_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  generated_pdf_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
};
*/ 