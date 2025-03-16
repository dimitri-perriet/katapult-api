const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Configuration du transporteur d'emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Fonction pour charger un template d'email
const loadEmailTemplate = (templateName) => {
  const templatePath = path.join(__dirname, `../templates/emails/${templateName}.html`);
  try {
    const template = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(template);
  } catch (error) {
    console.error(`Erreur lors du chargement du template ${templateName} :`, error);
    return null;
  }
};

// Fonction pour envoyer un email
const sendEmail = async (options) => {
  const transporter = createTransporter();
  
  // Configurer les options de l'email
  const mailOptions = {
    from: `"Katapult" <${process.env.EMAIL_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };
  
  // Ajouter des pièces jointes si présentes
  if (options.attachments) {
    mailOptions.attachments = options.attachments;
  }
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email envoyé : ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email :', error);
    throw error;
  }
};

// Envoyer un email de confirmation d'inscription
exports.sendWelcomeEmail = async (email, firstName) => {
  const template = loadEmailTemplate('welcome');
  
  if (!template) {
    throw new Error('Template d\'email non trouvé');
  }
  
  const html = template({
    firstName,
    loginLink: `${process.env.FRONTEND_URL}/login`,
    year: new Date().getFullYear(),
  });
  
  await sendEmail({
    to: email,
    subject: 'Bienvenue sur Katapult',
    html,
  });
};

// Envoyer un email de réinitialisation de mot de passe
exports.sendPasswordResetEmail = async (email, firstName, resetToken) => {
  const template = loadEmailTemplate('password-reset');
  
  if (!template) {
    throw new Error('Template d\'email non trouvé');
  }
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const html = template({
    firstName,
    resetUrl,
    year: new Date().getFullYear(),
  });
  
  await sendEmail({
    to: email,
    subject: 'Réinitialisation de votre mot de passe Katapult',
    html,
  });
};

// Envoyer un email de confirmation de soumission de candidature
exports.sendSubmissionConfirmationEmail = async (email, firstName, projectName) => {
  const template = loadEmailTemplate('submission-confirmation');
  
  if (!template) {
    throw new Error('Template d\'email non trouvé');
  }
  
  const html = template({
    firstName,
    projectName,
    dashboardLink: `${process.env.FRONTEND_URL}/dashboard`,
    year: new Date().getFullYear(),
  });
  
  await sendEmail({
    to: email,
    subject: 'Confirmation de soumission de votre candidature Katapult',
    html,
  });
};

// Envoyer une relance pour une candidature incomplète
exports.sendReminderEmail = async (email, firstName, projectName) => {
  const template = loadEmailTemplate('reminder');
  
  if (!template) {
    throw new Error('Template d\'email non trouvé');
  }
  
  const html = template({
    firstName,
    projectName,
    dashboardLink: `${process.env.FRONTEND_URL}/dashboard`,
    year: new Date().getFullYear(),
  });
  
  await sendEmail({
    to: email,
    subject: 'Rappel : Votre candidature Katapult est en attente',
    html,
  });
};

// Envoyer un email de décision (acceptation ou refus)
exports.sendDecisionEmail = async (email, firstName, projectName, isAccepted, message, pdfPath) => {
  const templateName = isAccepted ? 'acceptance' : 'rejection';
  const template = loadEmailTemplate(templateName);
  
  if (!template) {
    throw new Error('Template d\'email non trouvé');
  }
  
  const html = template({
    firstName,
    projectName,
    message,
    dashboardLink: `${process.env.FRONTEND_URL}/dashboard`,
    year: new Date().getFullYear(),
  });
  
  const options = {
    to: email,
    subject: isAccepted ? 'Félicitations ! Votre projet a été sélectionné' : 'Résultat de votre candidature Katapult',
    html,
  };
  
  // Ajouter le PDF en pièce jointe si disponible
  if (pdfPath) {
    const fullPath = path.join(__dirname, '../../', pdfPath.startsWith('/') ? pdfPath.substring(1) : pdfPath);
    if (fs.existsSync(fullPath)) {
      options.attachments = [
        {
          filename: isAccepted ? 'lettre_acceptation.pdf' : 'lettre_decision.pdf',
          path: fullPath,
        },
      ];
    }
  }
  
  await sendEmail(options);
};

// Envoyer un email de notification d'évaluation
exports.sendEvaluationNotificationEmail = async (email, firstName, projectName, evaluatorName) => {
  const template = loadEmailTemplate('evaluation-notification');
  
  if (!template) {
    throw new Error('Template d\'email non trouvé');
  }
  
  const html = template({
    firstName,
    projectName,
    evaluatorName,
    dashboardLink: `${process.env.FRONTEND_URL}/dashboard`,
    year: new Date().getFullYear(),
  });
  
  await sendEmail({
    to: email,
    subject: 'Votre candidature est en cours d\'évaluation',
    html,
  });
};

// Envoyer un email de vérification
exports.sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
  
  const html = `
    <h1>Vérification de votre adresse email</h1>
    <p>Merci de vous être inscrit sur la plateforme Katapult. Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :</p>
    <a href="${verificationUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vérifier mon email</a>
    <p>Si vous n'avez pas créé ce compte, veuillez ignorer cet email.</p>
    <p>Cordialement,<br>L'équipe Katapult</p>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Vérification de votre adresse email - Katapult',
    html,
  });
}; 