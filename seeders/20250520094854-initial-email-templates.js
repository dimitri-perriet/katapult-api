'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const templates = [
      {
        name: 'submission_confirmation',
        subject: 'Confirmation de soumission de votre candidature {{applicationName}}',
        body: `
<h1 style="font-size: 22px; color: #0d2d5e; margin-top: 0; margin-bottom: 20px;">Confirmation de soumission</h1>
<p>Bonjour {{firstName}} {{lastName}},</p>
<p>Nous vous confirmons la bonne réception de votre candidature "<strong>{{applicationName}}</strong>".</p>
<p>Elle a été soumise le {{submissionDate}}.</p>
<p>Vous pouvez suivre son avancement et la consulter à tout moment via le lien ci-dessous :</p>
<p style="text-align: center; margin-bottom: 30px;">
  <a href="{{applicationLink}}" class="button-link" style="background-color: #007bff; color: #ffffff;">Voir ma candidature</a>
</p>
<p>Cordialement,</p>
<p>L'équipe Katapult</p>
        `.trim(),
        description: 'Email envoyé à l\'utilisateur lors de la soumission initiale de sa candidature.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'application_status_submitted',
        subject: 'Votre candidature {{applicationName}} a été soumise',
        body: `
<h1 style="font-size: 22px; color: #0d2d5e; margin-top: 0; margin-bottom: 20px;">Votre candidature a été soumise</h1>
<p>Bonjour {{firstName}} {{lastName}},</p>
<p>Votre candidature "<strong>{{applicationName}}</strong>" a bien été marquée comme soumise.</p>
<p>Nous allons l'examiner prochainement. Vous pouvez suivre son avancement via le lien ci-dessous :</p>
<p style="text-align: center; margin-bottom: 30px;">
  <a href="{{applicationLink}}" class="button-link" style="background-color: #007bff; color: #ffffff;">Suivre ma candidature</a>
</p>
<p>Cordialement,</p>
<p>L'équipe Katapult</p>
        `.trim(),
        description: 'Email envoyé si une candidature passe au statut \'soumise\' après avoir été en brouillon par exemple.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'application_status_review',
        subject: 'Votre candidature {{applicationName}} est en cours d\'évaluation',
        body: `
<h1 style="font-size: 22px; color: #0d2d5e; margin-top: 0; margin-bottom: 20px;">Candidature en cours d'évaluation</h1>
<p>Bonjour {{firstName}} {{lastName}},</p>
<p>Bonne nouvelle ! Votre candidature "<strong>{{applicationName}}</strong>" est maintenant en cours d'évaluation par notre équipe.</p>
<p>Nous vous tiendrons informé de la suite donnée. Vous pouvez consulter votre candidature ici :</p>
<p style="text-align: center; margin-bottom: 30px;">
  <a href="{{applicationLink}}" class="button-link" style="background-color: #007bff; color: #ffffff;">Consulter ma candidature</a>
</p>
<p>Cordialement,</p>
<p>L'équipe Katapult</p>
        `.trim(),
        description: 'Email envoyé lorsque la candidature passe au statut \'en cours d\'évaluation\'.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'application_status_accepted',
        subject: 'Félicitations ! Votre candidature {{applicationName}} a été acceptée',
        body: `
<h1 style="font-size: 22px; color: #198754; margin-top: 0; margin-bottom: 20px;">Félicitations, candidature acceptée !</h1>
<p>Bonjour {{firstName}} {{lastName}},</p>
<p>Excellente nouvelle ! Nous avons le plaisir de vous informer que votre candidature "<strong>{{applicationName}}</strong>" a été acceptée.</p>
<p>Nous reviendrons vers vous très prochainement avec plus de détails sur les prochaines étapes.</p>
<p style="text-align: center; margin-bottom: 30px;">
  <a href="{{applicationLink}}" class="button-link" style="background-color: #198754; color: #ffffff;">Voir les détails</a>
</p>
<p>Cordialement,</p>
<p>L'équipe Katapult</p>
        `.trim(),
        description: 'Email envoyé lorsque la candidature est acceptée.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'application_status_rejected',
        subject: 'Concernant votre candidature {{applicationName}}',
        body: `
<h1 style="font-size: 22px; color: #dc3545; margin-top: 0; margin-bottom: 20px;">Suite à votre candidature</h1>
<p>Bonjour {{firstName}} {{lastName}},</p>
<p>Nous vous remercions de l'intérêt que vous portez à notre programme avec votre candidature "<strong>{{applicationName}}</strong>".</p>
<p>Après un examen attentif, nous sommes au regret de vous informer qu'elle n'a pas été retenue cette fois-ci.</p>
{{#if adminNotes}}
<div class="admin-notes-block">
  <p>{{adminNotes}}</p>
</div>
{{/if}}
<p>Nous vous encourageons à persévérer dans vos projets.</p>
<p>Cordialement,</p>
<p>L'équipe Katapult</p>
        `.trim(),
        description: 'Email envoyé lorsque la candidature est rejetée.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'application_status_draft_return',
        subject: 'Votre candidature {{applicationName}} a été remise en brouillon',
        body: `
<h1 style="font-size: 22px; color: #ffc107; margin-top: 0; margin-bottom: 20px;">Candidature remise en brouillon</h1>
<p>Bonjour {{firstName}} {{lastName}},</p>
<p>Votre candidature "<strong>{{applicationName}}</strong>" a été remise à l'état de brouillon.</p>
<p>Cela peut être dû à une demande de modifications ou d'informations complémentaires.</p>
{{#if adminNotes}}
<div class="admin-notes-block" style="border-left-color: #0dcaf0;">
   <p>{{adminNotes}}</p>
</div>
{{/if}}
<p>Veuillez la consulter et la soumettre à nouveau une fois complétée via le lien suivant :</p>
<p style="text-align: center; margin-bottom: 30px;">
  <a href="{{applicationLink}}" class="button-link" style="background-color: #ffc107; color: #000;">Modifier ma candidature</a>
</p>
<p>Cordialement,</p>
<p>L'équipe Katapult</p>
        `.trim(),
        description: 'Email envoyé lorsque la candidature est remise en brouillon par un admin.',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('email_templates', templates, {});
  },

  async down (queryInterface, Sequelize) {
    // Supprimer uniquement les templates que nous avons ajoutés par leur nom
    await queryInterface.bulkDelete('email_templates', { 
      name: [
        'submission_confirmation',
        'application_status_submitted',
        'application_status_review',
        'application_status_accepted',
        'application_status_rejected',
        'application_status_draft_return'
      ]
    }, {});
  }
};
