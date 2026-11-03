import LegalPage from '../../components/LegalPage';

export default function Screen() {
  return (
    <LegalPage
      title="Annexe de sous-traitance des données"
      updatedAt="2 novembre 2026"
      sections={[
        {
          title: '1. Parties et objet',
          content:
            'Le client identifié au bon de commande est responsable des traitements opérationnels. Lucas Mezen, EI TRADIKOM, agit comme sous-traitant pour héberger, afficher, organiser, sauvegarder et exporter les données nécessaires au service OpsPilot, pendant la durée du contrat et sa phase de restitution.',
        },
        {
          title: '2. Données et personnes concernées',
          content:
            'Personnes concernées : utilisateurs professionnels et salariés habilités du client. Données : identité professionnelle, rôle, organisation, activité, résultats de formation, audits, tâches, messages et preuves photo ; position d’audit uniquement si activée. Le client s’abstient de déposer des données sensibles, des pièces d’identité ou des informations personnelles de tiers sans nécessité ni cadre approprié.',
        },
        {
          title: '3. Instructions et confidentialité',
          content:
            'TRADIKOM traite les données selon les instructions documentées du client pour fournir le service. Il signale une instruction qu’il considère contraire aux règles de protection des données. Les personnes habilitées sont soumises à la confidentialité et disposent d’un accès limité à leurs missions.',
        },
        {
          title: '4. Sécurité et incidents',
          content:
            'Les mesures comprennent l’authentification, les permissions par rôle, le cloisonnement par organisation, le stockage privé des preuves et la journalisation des opérations de plateforme. Un incident affectant les données du client lui est notifié sans délai indu après sa connaissance, avec les informations disponibles puis les compléments utiles.',
        },
        {
          title: '5. Prestataires ultérieurs',
          content:
            'Supabase : authentification, base et stockage des preuves, région de production Paris. Vercel : diffusion de l’application web. Resend : emails transactionnels, domaine d’envoi actuellement configuré en région américaine ; les messages doivent se limiter aux informations nécessaires. Les fonctions d’assistance IA sollicitent les prestataires indiqués dans la confidentialité lorsqu’elles sont activées. Le bon de commande précise les prestataires optionnels autorisés et les garanties de transfert applicables. Toute modification envisagée est annoncée au client pour lui permettre de formuler une objection motivée.',
        },
        {
          title: '6. Assistance et contrôle',
          content:
            'TRADIKOM aide le client à traiter les demandes de droits, incidents, analyses d’impact et contrôles concernant le service. Il fournit les informations nécessaires pour démontrer le respect des obligations et organise les vérifications raisonnables convenues avec le client, en protégeant les autres organisations.',
        },
        {
          title: '7. Restitution et suppression',
          content:
            'À la fin du contrat, le client choisit la restitution puis la suppression, ou la suppression directe, sous réserve des obligations légales. Les demandes d’export sont possibles pendant 30 jours. La base active est purgée sous 90 jours ; les copies de sauvegarde expirent selon le cycle documenté du prestataire et ne sont pas remises en exploitation sans appliquer à nouveau les suppressions.',
        },
        {
          title: '8. Contact et intégration contractuelle',
          content:
            'Contact : contact@tradikom.com. Cette annexe accompagne le devis et les conditions commerciales ; elle est acceptée avec eux. Les instructions spécifiques, durées particulières et prestataires optionnels figurent au bon de commande.',
        },
      ]}
    />
  );
}
