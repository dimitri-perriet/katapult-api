const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const candidatureService = require('../services/candidature.service');

const NEW_LOGO_FILENAME = 'logo-katapult-baseline-quadri-site.png';
const MAIN_TEXT_COLOR = '#4A4A4A'; // Gris foncé pour le corps du texte
const TITLE_COLOR = '#2D4EA2';     // Couleur des titres principaux
const SUBTITLE_COLOR = '#333333';  // Couleur des sous-titres

// Fonction utilitaire pour ajouter un champ avec une étiquette et une valeur
function addField(doc, label, value, options = {}) {
  doc.font('Helvetica-Bold').fillColor(SUBTITLE_COLOR).text(label, { continued: !options.blockValue });
  if (options.blockValue) {
    doc.font('Helvetica').fillColor(MAIN_TEXT_COLOR).text(value || 'Non renseigné', { align: 'justify' });
  } else {
    doc.font('Helvetica').fillColor(MAIN_TEXT_COLOR).text(`: ${value || 'Non renseigné'}`);
  }
  doc.moveDown(0.6); // Légère augmentation de l'espace
}

// Fonction pour ajouter un titre de section principal
function addMainSectionTitle(doc, title) {
  // S'assurer qu'il y a assez de place pour le titre et un peu de contenu,
  // sinon, passer à une nouvelle page.
  if (doc.y > doc.page.height - 150) { // Seuil ajustable
    doc.addPage();
  }
  doc.font('Helvetica-Bold').fontSize(16).fillColor(TITLE_COLOR).text(title, { align: 'left' });
  doc.moveDown(0.5);
  drawSectionDivider(doc);
  doc.fillColor(MAIN_TEXT_COLOR).fontSize(12); // Réinitialiser la couleur pour le contenu suivant
}

// Ancienne addSectionTitle renommée et modifiée (n'ajoute plus de page automatiquement)
function addSubTitle(doc, title) {
  doc.font('Helvetica-Bold').fontSize(14).fillColor(SUBTITLE_COLOR).text(title);
  doc.moveDown(0.6);
  doc.fillColor(MAIN_TEXT_COLOR).fontSize(12);
}

function addCheckboxValue(doc, label, value) {
  doc.fillColor(SUBTITLE_COLOR).font('Helvetica-Bold').text(label + ': ', { continued: true });
  doc.fillColor(MAIN_TEXT_COLOR).font('Helvetica').text(value ? 'Oui' : 'Non');
  doc.moveDown(0.6);
}

function addTextAreaValue(doc, label, value) {
  doc.font('Helvetica-Bold').fillColor(SUBTITLE_COLOR).text(label + ':', { underline: false });
  doc.moveDown(0.2);
  doc.font('Helvetica').fillColor(MAIN_TEXT_COLOR).text(value || 'Non renseigné', { align: 'justify' });
  doc.moveDown(0.8); // Ajuster l'espacement
}

// Fonction utilitaire pour parser un champ JSON
const parseJSONField = (field) => {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      console.warn('Erreur de parsing JSON pour le champ (valeur originale conservée):', field, e);
      return {};
    }
  }
  return field || {};
};

// Fonction utilitaire pour dessiner l'en-tête moderne
function drawModernHeader(doc, ficheIdentite, logoPath) {
  const headerHeight = 70; // Réduire légèrement la hauteur
  doc.save();
  doc.rect(0, 0, doc.page.width, headerHeight).fill('#F0F2F5'); // Couleur de fond légèrement plus visible
  doc.restore();

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, doc.page.margins.left, 18, { height: 34 }); // Ajusté pour les nouvelles marges
  } else {
    console.warn(`[PDF Generator] Logo non trouvé au chemin: ${logoPath}`);
  }
  doc.fillColor(TITLE_COLOR).font('Helvetica-Bold').fontSize(18).text('Dossier de Candidature', doc.page.margins.left, 25, {
    align: 'center' // Centré par rapport à la page entière
  });
  if (ficheIdentite.projectName) {
    doc.font('Helvetica').fontSize(11).fillColor(SUBTITLE_COLOR).text(ficheIdentite.projectName, doc.page.margins.left, 48, {
      align: 'center' // Centré par rapport à la page entière
    });
  }
  doc.moveDown(2.5); // Ajuster l'espace après l'en-tête
}

// Fonction utilitaire pour un séparateur de section moderne
function drawSectionDivider(doc) {
  doc.moveDown(0.3);
  doc.strokeColor(TITLE_COLOR).opacity(0.5).lineWidth(0.8).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
  doc.opacity(1); // Rétablir l'opacité
  doc.moveDown(0.6);
}

// Fonction pour générer un PDF à partir d'une candidature
exports.generatePDF = async (candidature) => {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfDir = path.join(__dirname, '../../uploads/pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // Parser les champs JSON ici
      const ficheIdentite = parseJSONField(candidature.fiche_identite);
      const projetUtiliteSociale = parseJSONField(candidature.projet_utilite_sociale);
      const quiEstConcerne = parseJSONField(candidature.qui_est_concerne);
      const modeleEconomique = parseJSONField(candidature.modele_economique);
      const partiesPrenantes = parseJSONField(candidature.parties_prenantes);
      const equipeProjet = parseJSONField(candidature.equipe_projet);
      const etatAvancement = parseJSONField(candidature.etat_avancement);
      const structureJuridique = parseJSONField(candidature.structure_juridique);
      const documents_json = parseJSONField(candidature.documents_json); // Aussi pour documents_json

      const projectNameClean = ficheIdentite.projectName
        ? ficheIdentite.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        : 'candidature';
      const filename = `candidature_${projectNameClean}_${Date.now()}.pdf`;
      const pdfPath = path.join(pdfDir, filename);

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 30, bottom: 30, left: 60, right: 60 }, // Augmentation des marges latérales
        bufferPages: true,
        info: {
          Title: `Dossier de Candidature - ${ficheIdentite.projectName || 'N/A'}`,
          Author: 'Katapult Incubateur',
          Subject: `Candidature pour ${ficheIdentite.projectName || 'N/A'}`,
          Keywords: 'candidature, incubateur, ESS, projet, Katapult',
        },
      });

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Enregistrer la police par défaut pour y revenir facilement
      const defaultFont = 'Helvetica';
      doc.font(defaultFont);

      // Chemin du logo
      const logoPath = path.join(__dirname, '../../public/img/', NEW_LOGO_FILENAME);

      // ---------- EN-TÊTE MODERNE ----------
      drawModernHeader(doc, ficheIdentite, logoPath);

      // Date de génération sous le bandeau
      const submissionDate = candidature.submission_date ? moment(candidature.submission_date).format('DD/MM/YYYY') : 'Non soumise';
      doc.fontSize(9).fillColor('#555555').text(`Soumis le : ${submissionDate} – Généré le : ${moment().format('DD/MM/YYYY HH:mm')}`, {
        align: 'center'
      });
      doc.moveDown(1.5);

      // ---------- SECTION 1 : Fiche d'identité ----------
      addMainSectionTitle(doc, "1. Fiche d'identité");
      addField(doc, 'Nom du projet', ficheIdentite.projectName);
      addField(doc, "Secteur d'activité principal", ficheIdentite.sector === 'autre' ? ficheIdentite.sectorOther : ficheIdentite.sector);
      addField(doc, "Territoire d'implantation", ficheIdentite.territory);
      addField(doc, "Zone géographique d'intervention", ficheIdentite.interventionZone);

      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fillColor(SUBTITLE_COLOR).text("Comment avez-vous eu connaissance de l'appel à candidatures ?");
      doc.moveDown(0.3);
      doc.font('Helvetica').fillColor(MAIN_TEXT_COLOR);
      if (ficheIdentite.referral_facebook_adress) doc.text("- Page Facebook de l'ADRESS");
      if (ficheIdentite.referral_linkedin_adress) doc.text("- Page LinkedIn de l'ADRESS");
      if (ficheIdentite.referral_instagram_adress) doc.text("- Page Instagram de l'ADRESS");
      if (ficheIdentite.referral_web_adress) doc.text("- Site internet de l'ADRESS");
      if (ficheIdentite.referral_mail_adress) doc.text("- Par un mail de l'ADRESS");
      if (ficheIdentite.referral_salarie_adress) doc.text("- Par un salarié de l'ADRESS");
      if (ficheIdentite.referral_medias) doc.text("- Par les médias (radio, presse, agenda en ligne)");
      if (ficheIdentite.referral_tiers_hors_adress) doc.text("- Information par un tiers hors ADRESS");
      if (!ficheIdentite.referral_facebook_adress && !ficheIdentite.referral_linkedin_adress && !ficheIdentite.referral_instagram_adress && !ficheIdentite.referral_web_adress && !ficheIdentite.referral_mail_adress && !ficheIdentite.referral_salarie_adress && !ficheIdentite.referral_medias && !ficheIdentite.referral_tiers_hors_adress) {
        doc.text('Non renseigné');
      }
      doc.moveDown(0.8);

      addSubTitle(doc, 'Structure juridique');
      addField(doc, 'Le projet est-il porté par une entreprise déjà en activité ?', structureJuridique.hasExistingStructure ? 'Oui' : 'Non');
      if (structureJuridique.hasExistingStructure) {
        addField(doc, 'Nom de la structure', structureJuridique.structureName);
        addField(doc, 'Numéro de SIRET', structureJuridique.structureSiret);
        addField(doc, 'Statut juridique', structureJuridique.structureStatus === 'autre' ? structureJuridique.structureStatusOther : structureJuridique.structureStatus);
        addField(doc, 'Date de création', structureJuridique.structureCreationDate ? moment(structureJuridique.structureCreationDate).format('DD/MM/YYYY') : 'N/A');
        addField(doc, "Dans quel cadre la structure candidate-t-elle à l'incubateur ?", structureJuridique.structureContext === 'autre' ? structureJuridique.structureContextOther : structureJuridique.structureContext);
        addField(doc, 'La personne référente pour le projet est-elle salariée par la structure ou bénévole ?', structureJuridique.referenceEmploymentType);
        addField(doc, 'Depuis combien de temps ?', structureJuridique.referenceEmploymentDuration);
      }
      doc.moveDown(0.8);

      // ---------- SECTION 2 : Votre projet et son utilité sociale ----------
      addMainSectionTitle(doc, "2. Votre projet et son utilité sociale");
      addTextAreaValue(doc, 'Expliquez la genèse de votre projet', projetUtiliteSociale.projectGenesis);
      addTextAreaValue(doc, 'Résumez votre projet', projetUtiliteSociale.projectSummary);
      addTextAreaValue(doc, 'À quel problème social et/ou environnemental souhaitez-vous répondre ?', projetUtiliteSociale.problemDescription);

      // ---------- SECTION 3 : Qui est concerné ? ----------
      addMainSectionTitle(doc, "3. Qui est concerné ?");
      addTextAreaValue(doc, 'Qui seront les bénéficiaires de votre projet ?', quiEstConcerne.beneficiaries);
      addTextAreaValue(doc, 'Qui seront les clients ?', quiEstConcerne.clients);
      addTextAreaValue(doc, 'Quelle solution souhaitez-vous proposer ? Quelle sera votre offre ?', quiEstConcerne.proposedSolution);
      addTextAreaValue(doc, 'En quoi votre projet est-il différent et/ou complémentaire des solutions existantes ?', quiEstConcerne.projectDifferentiation);
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text("Premiers indicateurs d'impact social pertinents :");
      doc.font('Helvetica');
      if (quiEstConcerne.indicator1) doc.text(`- ${quiEstConcerne.indicator1}`);
      if (quiEstConcerne.indicator2) doc.text(`- ${quiEstConcerne.indicator2}`);
      if (quiEstConcerne.indicator3) doc.text(`- ${quiEstConcerne.indicator3}`);
      if (quiEstConcerne.indicator4) doc.text(`- ${quiEstConcerne.indicator4}`);
      if (quiEstConcerne.indicator5) doc.text(`- ${quiEstConcerne.indicator5}`);
      if (!quiEstConcerne.indicator1 && !quiEstConcerne.indicator2 && !quiEstConcerne.indicator3 && !quiEstConcerne.indicator4 && !quiEstConcerne.indicator5) {
        doc.text('Non renseignés');
      }
      doc.moveDown(1);

      // ---------- SECTION 4 : Le modèle économique ----------
      addMainSectionTitle(doc, "4. Le modèle économique");
      addTextAreaValue(doc, 'Quelles sont les sources de revenus envisagées pour votre projet ?', modeleEconomique.revenueSources);
      addTextAreaValue(doc, "Combien d'emplois pensez-vous créer sur les premières années d'activités ?", modeleEconomique.employmentCreation);
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text("Éléments permettant d'affirmer la viabilité économique du projet :");
      doc.font('Helvetica');
      if (modeleEconomique.viabilityElement1) doc.text(`1. ${modeleEconomique.viabilityElement1}`);
      if (modeleEconomique.viabilityElement2) doc.text(`2. ${modeleEconomique.viabilityElement2}`);
      if (modeleEconomique.viabilityElement3) doc.text(`3. ${modeleEconomique.viabilityElement3}`);
      if (modeleEconomique.viabilityElement4) doc.text(`4. ${modeleEconomique.viabilityElement4}`);
      if (modeleEconomique.viabilityElement5) doc.text(`5. ${modeleEconomique.viabilityElement5}`);
      if (!modeleEconomique.viabilityElement1 && !modeleEconomique.viabilityElement2 && !modeleEconomique.viabilityElement3 && !modeleEconomique.viabilityElement4 && !modeleEconomique.viabilityElement5) {
        doc.text('Non renseignés');
      }
      doc.moveDown(1);
      addTextAreaValue(doc, 'Quels pourraient être les projets de diversification et de développement économique ?', modeleEconomique.diversification);

      // ---------- SECTION 5 : La place des parties prenantes ----------
      addMainSectionTitle(doc, "5. La place des parties prenantes");
      addTextAreaValue(doc, 'Avez-vous déjà établi des contacts ou partenariats ?', partiesPrenantes.existingPartnerships);
      addTextAreaValue(doc, 'Quels autres contacts ou partenariats recherchez-vous ?', partiesPrenantes.desiredPartnerships);
      addTextAreaValue(doc, 'Quel rôle voudriez-vous que jouent ces différents acteurs ?', partiesPrenantes.stakeholderRole);

      // ---------- SECTION 6 : L'équipe projet et parcours d'incubation ----------
      addMainSectionTitle(doc, "6. L'équipe projet et parcours d'incubation");
      const reference = equipeProjet.reference || {};
      addSubTitle(doc, 'Personne référente');
      addField(doc, 'Nom', reference.lastName);
      addField(doc, 'Prénom', reference.firstName);
      addField(doc, 'Date de naissance', reference.DOB ? moment(reference.DOB).format('DD/MM/YYYY') : 'N/A');
      addField(doc, 'Adresse', reference.address);
      addField(doc, 'E-mail', reference.email);
      addField(doc, 'Téléphone', reference.telephone);
      doc.moveDown(1);

      if (equipeProjet.teamMembers && equipeProjet.teamMembers.length > 0) {
        addSubTitle(doc, 'Autres personnes impliquées dans le projet');
        equipeProjet.teamMembers.forEach((member, index) => {
          doc.font('Helvetica-Bold').text(`Membre ${index + 1}:`);
          addField(doc, 'Nom', member.lastName);
          addField(doc, 'Prénom', member.firstName);
          addField(doc, 'Email', member.email);
          addField(doc, 'Téléphone', member.telephone);
          doc.moveDown(0.5);
        });
      }
      doc.moveDown(1);

      addSubTitle(doc, "Présentation de l'équipe et expérience");
      addTextAreaValue(doc, 'Présentez-vous succinctement', equipeProjet.teamPresentation);
      addCheckboxValue(doc, 'Avez-vous une expérience entrepreneuriale ?', equipeProjet.hasEntrepreneurialExperience);
      if (equipeProjet.hasEntrepreneurialExperience) {
        addTextAreaValue(doc, 'Si oui, laquelle ?', equipeProjet.entrepreneurialExperience);
      }
      addField(doc, 'Citez un entrepreneur social qui vous inspire', equipeProjet.inspiringEntrepreneur);
      addTextAreaValue(doc, 'Quelles sont selon vous les compétences manquantes dans l\'équipe ?', equipeProjet.missingTeamSkills);
      addTextAreaValue(doc, 'Qui suivra le parcours d\'incubation ?', equipeProjet.incubationParticipants);
      doc.moveDown(1);

      addSubTitle(doc, "Place de chacun des membres de l'équipe projet");
      if (equipeProjet.projectMembersRoles && equipeProjet.projectMembersRoles.length > 0) {
        equipeProjet.projectMembersRoles.forEach((member, index) => {
          doc.font('Helvetica-Bold').text('Porteur de projet ' + (index + 1) + ': ' + (member.name || 'N/A'));
          doc.moveDown(0.5);
          doc.font('Helvetica');
          doc.text('Court terme (1 an):');
          doc.text('  Type: ' + (member.shortTerm?.type || 'N/A') + ', Missions: ' + (member.shortTerm?.details || 'N/A'));
          doc.moveDown(0.2);
          doc.text('Moyen terme (3 ans):');
          doc.text('  Type: ' + (member.mediumTerm?.type || 'N/A') + ', Missions: ' + (member.mediumTerm?.details || 'N/A'));
          doc.moveDown(0.2);
          doc.text('Long terme (10 ans):');
          doc.text('  Type: ' + (member.longTerm?.type || 'N/A') + ', Missions: ' + (member.longTerm?.details || 'N/A'));
          doc.moveDown(1);
        });
      } else {
        doc.text('Non renseigné.');
        doc.moveDown(1);
      }

      addTextAreaValue(doc, 'Quelle est votre situation professionnelle actuelle ?', equipeProjet.currentProfessionalSituation);
      addTextAreaValue(doc, 'Quels seront vos revenus durant la période d\'incubation ?', equipeProjet.incubationPeriodIncome);
      addTextAreaValue(doc, 'Quel volume horaire hebdomadaire pouvez-vous dédier au parcours ?', equipeProjet.weeklyTimeCommitment);
      doc.moveDown(1);

      addSubTitle(doc, "L'équipe et le parcours d'incubation");
      addTextAreaValue(doc, "Pourquoi souhaitez-vous intégrer l'incubateur de l'ADRESS ?", equipeProjet.incubatorMotivation);
      addTextAreaValue(doc, "Que pouvez-vous apporter à l'incubateur et aux incubés ?", equipeProjet.contributionToIncubator);

      // ---------- SECTION 7 : État d'avancement du projet ----------
      addMainSectionTitle(doc, "7. État d'avancement du projet");
      addTextAreaValue(doc, 'Avez-vous été ou êtes-vous accompagnés par ailleurs ?', etatAvancement.otherSupport);
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Quelles sont les étapes déjà réalisées ?');
      doc.font('Helvetica');
      const etapesRealisees = [
        { label: 'Diagnostic territorial, étude du besoin social / environnemental', data: etatAvancement.diagnostic },
        { label: 'Constitution d\'un collectif moteur', data: etatAvancement.collectif },
        { label: 'Expérimentation terrain - 1ers résultats', data: etatAvancement.experimentation },
        { label: 'Etude de marché', data: etatAvancement.etudeMarche },
        { label: 'Formalisation de l\'offre', data: etatAvancement.offre },
        { label: 'Premier chiffrage', data: etatAvancement.chiffrage },
      ];
      etapesRealisees.forEach(etape => {
        let detailsText = etape.data?.details ? ' (' + etape.data.details + ')' : '';
        doc.text(etape.label + ': ' + (etape.data?.status || 'N/A') + detailsText);
        doc.moveDown(0.3);
      });
      doc.moveDown(0.7);

      addTextAreaValue(doc, 'Quel est le premier risque que vous ayez pris à ce jour pour votre projet ?', etatAvancement.firstRisk);
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Analyse SWOT :');
      doc.font('Helvetica');
      doc.text(`  Forces: ${etatAvancement.swot?.strengths || 'N/A'}`);
      doc.text(`  Faiblesses: ${etatAvancement.swot?.weaknesses || 'N/A'}`);
      doc.text(`  Opportunités: ${etatAvancement.swot?.opportunities || 'N/A'}`);
      doc.text(`  Menaces: ${etatAvancement.swot?.threats || 'N/A'}`);
      doc.moveDown(1);
      addTextAreaValue(doc, 'Comment palliez-vous vos faiblesses et contournez-vous les menaces ?', etatAvancement.weaknessesAndThreatsStrategy);
      addTextAreaValue(doc, 'A quelle échéance souhaitez-vous créer ? Quel est votre plan d\'action / calendrier prévisionnel ?', etatAvancement.creationTimeline);
      doc.moveDown(0.5);
      addField(doc, 'Êtes-vous prêts à vous déplacer en Normandie ?', etatAvancement.readyToTravel);
      addField(doc, 'Êtes-vous prêt à communiquer sur votre projet ?', etatAvancement.readyToCommunicate);
      addField(doc, 'Êtes-vous prêt à vous engager dans un parcours intensif d\'un an ?', etatAvancement.readyToCommit);

      // ---------- SECTION 8 : Documents justificatifs ----------
      addMainSectionTitle(doc, "8. Documents justificatifs");
      const mainDoc = documents_json?.businessPlan;
      if (mainDoc && mainDoc.name) {
        addField(doc, 'Document principal fourni', mainDoc.name);
      } else if (candidature.document_path) {
        addField(doc, 'Document fourni', path.basename(candidature.document_path));
      } else {
        doc.font('Helvetica').fillColor(MAIN_TEXT_COLOR).text('Aucun document principal listé dans les données structurées.');
      }
      doc.moveDown(1);

      // ---------- PIED DE PAGE MODERNE ----------
      const range = doc.bufferedPageRange();
      const oldBottomMargin = doc.page.margins.bottom; // Sauvegarder l'ancienne marge

      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0; // Permettre de dessiner jusqu'en bas

        // Calculer les positions Y basées sur l'ancienne marge pour un positionnement cohérent
        const footerLineY = doc.page.height - oldBottomMargin + 10;
        const logoY = doc.page.height - oldBottomMargin + 15;
        const pageNumY = doc.page.height - oldBottomMargin + 20;

        // Dessiner la ligne de séparation du pied de page
        doc.strokeColor('#E0E0E0').lineWidth(0.5)
           .moveTo(doc.page.margins.left, footerLineY)
           .lineTo(doc.page.width - doc.page.margins.right, footerLineY)
           .stroke();
        
        // Afficher le logo dans le pied de page
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, doc.page.margins.left, logoY, { height: 15 });
        }
        
        // Afficher le numéro de page
        doc.fontSize(8).fillColor('#666666')
           .text(`Page ${i + 1} / ${range.count}`, 0, pageNumY, { align: 'center' });

        doc.page.margins.bottom = oldBottomMargin; // Restaurer la marge pour cette page
      }

      doc.end(); // Finaliser le document APRÈS avoir ajouté les pieds de page

      stream.on('finish', async () => {
        try {
        const relativePath = `/uploads/pdfs/${filename}`;
          await candidatureService.updateCandidature(candidature.id, { generated_pdf_url: relativePath });
          console.log(`Candidature ${candidature.id} mise à jour avec l'URL du PDF: ${relativePath}`);
        resolve(relativePath);
        } catch (dbError) {
          console.error(`Erreur lors de la mise à jour de la candidature ${candidature.id} avec l'URL du PDF:`, dbError);
          reject(dbError); 
        }
      });

      stream.on('error', (err) => {
        console.error("Erreur stream PDF:", err);
        reject(err);
      });

    } catch (error) {
      console.error("Erreur génération PDF globale:", error);
      reject(error);
    }
  });
}; 