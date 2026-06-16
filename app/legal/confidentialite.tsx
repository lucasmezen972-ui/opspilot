import { Linking, Text } from 'react-native';

import LegalPage, { legalStyles } from '../../components/LegalPage';

export default function PrivacyPolicyScreen() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      updatedAt="10 juin 2026"
      sections={[
        {
          title: '1. Qui traite vos données ?',
          content:
            "Pour les comptes professionnels, l'organisation cliente est responsable des données opérationnelles saisies par ses équipes. L'éditeur d'OpsPilot agit comme sous-traitant pour fournir, sécuriser et maintenir le service. Pour la gestion des comptes, du support et de la facturation, l'éditeur agit comme responsable de traitement.",
        },
        {
          title: '2. Données concernées',
          content: (
            <>
              <Text style={legalStyles.bullet}>
                • Identité professionnelle : nom, prénom, adresse e-mail, rôle
                et organisation.
              </Text>
              <Text style={legalStyles.bullet}>
                • Données d’activité : audits, tâches, actions correctives,
                formations et journaux techniques.
              </Text>
              <Text style={legalStyles.bullet}>
                • Données facultatives selon les fonctions utilisées : photos,
                position lors d’un audit et pièces jointes.
              </Text>
              <Text style={legalStyles.bullet}>
                • Données de connexion et de sécurité nécessaires au
                fonctionnement du service.
              </Text>
            </>
          ),
        },
        {
          title: '3. Finalités et bases légales',
          content:
            "Les données sont utilisées pour exécuter le contrat de service, authentifier les utilisateurs, fournir les fonctions opérationnelles, assurer la sécurité, répondre au support et respecter les obligations légales. Les fonctions facultatives reposent sur leur activation par l'organisation et, lorsque la loi l'exige, sur le consentement de la personne.",
        },
        {
          title: '4. Destinataires et sous-traitants',
          content:
            "L'accès est limité aux personnes autorisées de l'organisation cliente et aux prestataires nécessaires au service. OpsPilot utilise notamment Supabase pour l'authentification et la base de données, GitHub Pages pour la diffusion de l'application web et, si la facturation est activée, Stripe pour les paiements. Chaque organisation doit vérifier et documenter les sous-traitants qu'elle active.",
        },
        {
          title: '5. Durées de conservation',
          content:
            "Les données du compte et les données métier sont conservées pendant la durée du contrat, puis supprimées ou restituées selon les modalités convenues avec l'organisation cliente. Les sauvegardes et journaux de sécurité sont conservés pendant une durée limitée compatible avec leur finalité. Les données soumises à une obligation légale peuvent être archivées pendant la durée imposée.",
        },
        {
          title: '6. Vos droits',
          content: (
            <>
              <Text style={legalStyles.paragraph}>
                Vous pouvez demander l’accès, la rectification, l’effacement, la
                limitation ou la portabilité de vos données, et vous opposer à
                certains traitements. Adressez d’abord votre demande à votre
                organisation ou à contact@tradikom.com. Une preuve d’identité
                pourra être demandée en cas de doute raisonnable.
              </Text>
              <Text
                style={legalStyles.link}
                onPress={() => Linking.openURL('https://www.cnil.fr/')}
              >
                Vous pouvez également saisir la CNIL.
              </Text>
            </>
          ),
        },
        {
          title: '7. Sécurité et transferts',
          content:
            'OpsPilot applique des mesures de contrôle d’accès, de journalisation, de chiffrement en transit et d’isolation des organisations. Certains prestataires peuvent traiter des données hors de l’Espace économique européen ; les mécanismes de transfert applicables doivent alors être documentés contractuellement.',
        },
        {
          title: '8. Cookies et stockage local',
          content:
            'L’application utilise les mécanismes strictement nécessaires à l’authentification, à la sécurité, au mode hors ligne et aux préférences. Aucun traceur publicitaire n’est prévu dans la version actuelle. Toute future mesure d’audience ou publicité nécessitant un consentement devra être désactivée jusqu’au choix de l’utilisateur.',
        },
        {
          title: '9. Contact',
          content:
            'Questions et demandes relatives aux données : contact@tradikom.com. Support général : contact@tradikom.com.',
        },
      ]}
    />
  );
}
