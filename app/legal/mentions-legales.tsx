import { Text } from 'react-native';

import LegalPage, { legalStyles } from '../../components/LegalPage';

export default function LegalNoticeScreen() {
  return (
    <LegalPage
      title="Mentions légales"
      updatedAt="10 juin 2026"
      notice="Publication bloquée pour un usage commercial tant que les informations signalées ci-dessous ne sont pas remplacées par l'identité juridique réelle de l'éditeur."
      sections={[
        {
          title: '1. Éditeur',
          content: (
            <>
              <Text style={legalStyles.placeholder}>
                À compléter : raison sociale ou nom de l’entrepreneur, forme
                juridique, capital social le cas échéant, adresse du siège,
                SIREN/SIRET et registre d’immatriculation.
              </Text>
              <Text style={legalStyles.paragraph}>
                Nom du service : OpsPilot{'\n'}
                Contact : contact@tradikom.com
              </Text>
            </>
          ),
        },
        {
          title: '2. Direction de la publication',
          content: (
            <Text style={legalStyles.placeholder}>
              À compléter : nom et qualité du directeur ou de la directrice de
              la publication.
            </Text>
          ),
        },
        {
          title: '3. Hébergement',
          content:
            'L’application web est diffusée au moyen de GitHub Pages, service de GitHub, Inc. Les services d’authentification, de base de données et de stockage applicatif reposent sur Supabase. Les coordonnées contractuelles et la région d’hébergement retenue doivent être reportées dans la documentation client.',
        },
        {
          title: '4. Propriété intellectuelle',
          content:
            'Sauf mention contraire, les éléments composant OpsPilot sont protégés par le droit de la propriété intellectuelle. Toute reproduction, adaptation, extraction ou diffusion non autorisée est interdite, sous réserve des droits accordés par les licences des composants tiers.',
        },
        {
          title: '5. Données personnelles',
          content:
            'Les traitements de données personnelles sont décrits dans la politique de confidentialité. Les demandes peuvent être adressées à contact@tradikom.com.',
        },
        {
          title: '6. Contact',
          content:
            'Contact général : contact@tradikom.com. Questions relatives à la protection des données : contact@tradikom.com.',
        },
      ]}
    />
  );
}
