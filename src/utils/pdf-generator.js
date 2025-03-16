const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const moment = require('moment');

// Fonction pour générer un PDF à partir d'une candidature
exports.generatePDF = async (candidature) => {
  return new Promise((resolve, reject) => {
    try {
      // Créer le dossier de destination s'il n'existe pas
      const pdfDir = path.join(__dirname, '../../uploads/pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // Créer le nom du fichier PDF
      const timestamp = Date.now();
      const projectName = candidature.project_name
        ? candidature.project_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        : 'candidature';
      const filename = `candidature_${projectName}_${timestamp}.pdf`;
      const pdfPath = path.join(pdfDir, filename);

      // Créer un nouveau document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Candidature - ${candidature.project_name}`,
          Author: 'Katapult',
          Subject: 'Candidature Incubateur ESS',
          Keywords: 'candidature, incubateur, ESS, projet',
        },
      });

      // Pipe le document dans un fichier
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Ajouter le logo de Katapult en haut du document
      // doc.image(path.join(__dirname, '../../public/img/logo-katapult.png'), 50, 45, { width: 150 });

      // Ajouter le titre
      doc.fontSize(24).text('Dossier de candidature', { align: 'center' });
      doc.moveDown();
      doc.fontSize(18).text(`Projet : ${candidature.project_name}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date de soumission : ${moment(candidature.submission_date || new Date()).format('DD/MM/YYYY')}`, { align: 'center' });
      doc.moveDown(2);

      // Informations sur le programme
      doc.fontSize(16).fillColor('#2D4EA2').text('Informations sur le programme', { underline: true });
      doc.moveDown();
      doc.fillColor('black').fontSize(12);
      doc.text(`Promotion : ${candidature.promotion || 'Non spécifiée'}`);
      doc.moveDown();

      // Informations personnelles
      doc.fontSize(16).fillColor('#2D4EA2').text('Informations personnelles', { underline: true });
      doc.moveDown();
      doc.fillColor('black').fontSize(12);
      if (candidature.user) {
        doc.text(`Nom : ${candidature.user.last_name || ''}`);
        doc.text(`Prénom : ${candidature.user.first_name || ''}`);
        doc.text(`Email : ${candidature.user.email || ''}`);
      }
      doc.text(`Téléphone : ${candidature.phone || ''}`);
      
      let address = '';
      if (candidature.street) address += candidature.street;
      if (candidature.postal_code || candidature.city) {
        address += `\n${candidature.postal_code || ''} ${candidature.city || ''}`;
      }
      if (candidature.country) address += `\n${candidature.country}`;
      if (address) doc.text(`Adresse : ${address}`);
      
      doc.moveDown();

      // Informations sur le projet
      doc.fontSize(16).fillColor('#2D4EA2').text('Informations sur le projet', { underline: true });
      doc.moveDown();
      doc.fillColor('black').fontSize(12);
      doc.text(`Nom du projet : ${candidature.project_name}`);
      doc.text(`Secteur d'activité : ${candidature.sector || 'Non spécifié'}`);
      doc.text(`Niveau de maturité : ${candidature.maturity_level || 'Non spécifié'}`);
      doc.text(`Zone d'implantation : ${candidature.implementation_area || 'Non spécifiée'}`);
      doc.text(`Zone d'intervention : ${candidature.intervention_area || 'Non spécifiée'}`);
      doc.moveDown();
      
      doc.text('Description du projet :', { underline: true });
      doc.text(candidature.project_description || '', { align: 'justify' });
      doc.moveDown();

      // Problématique et solution
      doc.fontSize(14).fillColor('#2D4EA2').text('Utilité sociale');
      doc.moveDown();
      doc.fillColor('black').fontSize(12);
      
      doc.text('Problématique identifiée :', { underline: true });
      doc.text(candidature.problem_statement || '', { align: 'justify' });
      doc.moveDown();
      
      doc.text('Solution proposée :', { underline: true });
      doc.text(candidature.solution_description || '', { align: 'justify' });
      doc.moveDown();

      // Informations sur l'équipe
      if (candidature.teamMembers && candidature.teamMembers.length > 0) {
        doc.addPage();
        doc.fontSize(16).fillColor('#2D4EA2').text('Informations sur l\'équipe', { underline: true });
        doc.moveDown();
        doc.fillColor('black').fontSize(12);
        doc.text(`Taille de l'équipe : ${candidature.teamMembers.length}`);
        doc.moveDown();
        
        doc.text('Membres de l\'équipe :', { underline: true });
        candidature.teamMembers.forEach((member, index) => {
          doc.text(`Membre ${index + 1}:`);
          doc.text(`Nom : ${member.member_name || ''}`);
          doc.text(`Rôle : ${member.member_role || ''}`);
          if (member.member_expertise) {
            doc.text(`Compétences : ${member.member_expertise || ''}`);
          }
          doc.moveDown();
        });
      }

      // Pied de page
      doc.fontSize(10).text('Document généré automatiquement par la plateforme Katapult', {
        align: 'center',
      });
      doc.text(`Date d'édition : ${moment().format('DD/MM/YYYY HH:mm')}`, {
        align: 'center',
      });

      // Finir le document
      doc.end();

      // Attendre que le stream soit fermé
      stream.on('finish', () => {
        // Retourner le chemin relatif du PDF
        const relativePath = `/uploads/pdfs/${filename}`;
        resolve(relativePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}; 