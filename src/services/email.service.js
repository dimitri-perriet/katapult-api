const nodemailer = require('nodemailer');
const db = require('../../models');

// Configuration du transporteur Nodemailer
// À FAIRE: Remplacer par vos propres configurations SMTP via les variables d'environnement
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true pour le port 465, false pour les autres
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password'
  },
  tls: {
    // Ne pas échouer sur les certificats auto-signés (pour le développement)
    rejectUnauthorized: process.env.NODE_ENV === 'production' 
  }
});

/**
 * Fonction simple de templating pour remplacer les placeholders.
 * @param {string} templateString - La chaîne du template (sujet ou corps).
 * @param {object} data - Un objet avec les données à injecter.
 * @returns {string} La chaîne avec les placeholders remplacés.
 */
const renderTemplate = (templateString, data) => {
  if (!templateString) return '';
  let rendered = templateString;
  for (const key in data) {
    const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
    rendered = rendered.replace(regex, data[key] === null || typeof data[key] === 'undefined' ? '' : data[key]);
  }
  return rendered;
};

const getEmailBaseLayout = (layoutData) => {
  const { subjectLine = 'Notification Katapult', apiBaseUrl = '', emailBodyContent = '' } = layoutData;

  // Assurer que apiBaseUrl ne termine pas par un slash pour éviter les doubles slashs
  const cleanApiBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjectLine}</title>
  <style>
    body {
      font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
      font-size: 16px;
      color: #333333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      width: 100%;
      background-color: #f4f4f4;
      padding: 20px 0;
    }
    .email-content {
      width: 600px;
      max-width: 100%;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      overflow: hidden; /* Pour que les coins arrondis s'appliquent aussi aux enfants directs */
    }
    .email-header {
      padding: 30px 20px;
      text-align: center;
      border-bottom: 1px solid #eeeeee;
    }
    .email-header img {
      max-width: 200px;
      height: auto;
    }
    .email-body {
      padding: 30px 40px;
      line-height: 1.6;
    }
    .email-body h1 {
      font-size: 22px;
      color: #0d2d5e; /* Couleur principale Katapult pour les titres */
      margin-top: 0;
      margin-bottom: 20px;
    }
    .email-body p {
      margin-bottom: 15px;
    }
    .email-body .button-link {
      background-color: #007bff; /* Couleur de bouton par défaut */
      color: #ffffff !important; /* !important pour s'assurer que la couleur du texte est blanche */
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      display: inline-block;
      text-align: center;
    }
    .email-footer {
      padding: 20px 40px;
      text-align: center;
      border-top: 1px solid #eeeeee;
      background-color: #f9f9f9;
      font-size: 12px;
      color: #777777;
    }
    /* Styles spécifiques pour certains placeholders si nécessaire */
    .admin-notes-block {
      background-color: #f8f9fa;
      border-left: 4px solid #ffc107; /* Jaune pour notes, peut être ajusté par template si besoin via styles inline */
      padding: 15px;
      margin: 20px 0;
      font-size: 15px;
    }
    .admin-notes-block p {
      margin:0;
      font-style: italic;
    }
  </style>
</head>
<body>
  <table class="email-container" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td>
        <table class="email-content" border="0" cellspacing="0" cellpadding="0" align="center">
          <!-- Header avec Logo -->
          <tr>
            <td class="email-header">
              <img src="https://adress-normandie.org/wp-content/uploads/2021/03/logo_katapult_bc-768x280.png" alt="Katapult Logo" />
            </td>
          </tr>
          <!-- Contenu principal -->
          <tr>
            <td class="email-body">
              ${emailBodyContent}
            </td>
          </tr>
          <!-- Pied de page -->
          <tr>
            <td class="email-footer">
              <p>Katapult - L'incubateur normand des entreprises socialement innovantes</p>
              <!-- Vous pouvez ajouter ici une adresse ou un lien vers votre site -->
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

class EmailService {
  /**
   * Envoie un email basé sur un template stocké en base de données.
   * @param {string} to - Adresse email du destinataire.
   * @param {string} templateName - Nom du template (ex: 'submission_confirmation').
   * @param {object} data - Données à injecter dans le template (ex: { userName: 'John Doe', applicationName: 'Mon Projet' }).
   * @returns {Promise<void>}
   */
  async sendEmailFromTemplate(to, templateName, data) {
    try {
      const emailTemplate = await db.EmailTemplate.findOne({ where: { name: templateName } });

      if (!emailTemplate) {
        console.error(`Email template "${templateName}" not found.`);
        // Optionnel: envoyer un email générique ou logger une erreur plus formelle
        // Pour l'instant, on ne fait rien pour ne pas bloquer le flux principal
        return;
      }

      const subject = renderTemplate(emailTemplate.subject, data);
      const specificHtmlBody = renderTemplate(emailTemplate.body, data);

      // Préparer les données pour le layout de base
      const layoutData = {
        subjectLine: subject,
        apiBaseUrl: data.apiBaseUrl || process.env.API_BASE_URL, // Assurer la présence de apiBaseUrl
        emailBodyContent: specificHtmlBody
      };

      const finalHtml = getEmailBaseLayout(layoutData);

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Katapult Platform" <noreply@example.com>', // Adresse de l'expéditeur
        to: to,
        subject: subject,
        html: finalHtml, // Utiliser le HTML final assemblé
        // text: textBody // Version texte simple
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to} using template ${templateName}`);

    } catch (error) {
      console.error(`Error sending email with template ${templateName} to ${to}:`, error);
      // Il est important de ne pas faire planter l'application si l'envoi d'email échoue.
      // Logger l'erreur est crucial.
      // throw error; // Décommenter si vous voulez que l'erreur remonte et soit gérée plus haut
    }
  }

  /**
   * Envoie un email direct (sans template de la BDD).
   * @param {string} to - Adresse email du destinataire.
   * @param {string} subject - Sujet de l'email.
   * @param {string} htmlBody - Corps de l'email en HTML.
   * @param {string} [textBody] - Corps de l'email en texte simple (optionnel).
   * @returns {Promise<void>}
   */
  async sendDirectEmail(to, subject, htmlBody, textBody) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Katapult Platform" <noreply@example.com>',
        to: to,
        subject: subject,
        html: htmlBody,
      };
      if (textBody) {
        mailOptions.text = textBody;
      }

      await transporter.sendMail(mailOptions);
      console.log(`Direct email sent successfully to ${to} with subject "${subject}"`);

    } catch (error) {
      console.error(`Error sending direct email to ${to} with subject "${subject}":`, error);
    }
  }
}

module.exports = new EmailService(); 