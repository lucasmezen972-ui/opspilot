import { Text } from 'react-native';

import LegalPage, { legalStyles } from '../../components/LegalPage';

export default function TermsScreen() {
  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      updatedAt="10 juin 2026"
      notice="Ces CGU encadrent l'utilisation de l'application. Les conditions commerciales, niveaux de service et modalités de paiement doivent être complétés dans un contrat ou des CGV avant toute vente."
      sections={[
        {
          title: '1. Objet',
          content:
            'OpsPilot est un service de pilotage des opérations terrain destiné aux organisations et à leurs équipes. Il permet notamment de gérer des audits, tâches, produits, actions correctives, formations et communications internes.',
        },
        {
          title: '2. Accès au service',
          content:
            'L’accès nécessite un compte autorisé par une organisation cliente. L’utilisateur doit fournir des informations exactes, préserver la confidentialité de ses identifiants et signaler rapidement tout accès non autorisé. Le mode démo contient uniquement des données fictives et ne doit pas recevoir de données réelles.',
        },
        {
          title: '3. Usages autorisés',
          content: (
            <>
              <Text style={legalStyles.bullet}>
                • Utiliser le service dans le cadre des activités autorisées par
                l’organisation.
              </Text>
              <Text style={legalStyles.bullet}>
                • Respecter les droits des personnes et les règles internes de
                sécurité.
              </Text>
              <Text style={legalStyles.bullet}>
                • Ne pas contourner les contrôles d’accès, perturber le service,
                introduire du code malveillant ou extraire abusivement des
                données.
              </Text>
            </>
          ),
        },
        {
          title: '4. Données et contenus',
          content:
            'L’organisation cliente reste responsable de la licéité, de l’exactitude et des droits attachés aux contenus qu’elle dépose. Elle détermine les habilitations de ses utilisateurs. OpsPilot traite ces contenus uniquement pour fournir et sécuriser le service, sous réserve des obligations légales.',
        },
        {
          title: '5. Disponibilité et maintenance',
          content:
            'Le service peut être interrompu pour maintenance, sécurité ou cas de force majeure. Les engagements de disponibilité, de support et de reprise applicables à un client payant sont ceux de son contrat ou de son offre d’abonnement.',
        },
        {
          title: '6. Propriété intellectuelle',
          content:
            'L’application, son interface, son code, ses marques et sa documentation sont protégés. Le droit d’utilisation accordé est limité, non exclusif, non transférable et valable pendant la durée d’accès au service. Les contenus importés restent la propriété de leurs titulaires.',
        },
        {
          title: '7. Responsabilité',
          content:
            'OpsPilot est un outil d’aide au pilotage et ne remplace ni le jugement professionnel, ni les contrôles réglementaires, ni les procédures de l’organisation. L’utilisateur doit vérifier les informations avant toute décision susceptible d’affecter la sécurité, la conformité ou les personnes.',
        },
        {
          title: '8. Suspension et fin d’accès',
          content:
            'L’accès peut être suspendu en cas de risque de sécurité, d’usage illicite, de violation grave des présentes conditions ou à la demande de l’organisation cliente. À la fin du contrat, l’accès et le sort des données suivent les modalités convenues avec l’organisation.',
        },
        {
          title: '9. Droit applicable',
          content:
            'Les présentes conditions sont soumises au droit français. Avant toute action contentieuse, les parties recherchent une solution amiable. La juridiction compétente doit être précisée dans le contrat conclu avec l’organisation cliente.',
        },
      ]}
    />
  );
}
