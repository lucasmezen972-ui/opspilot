import LegalPage from '../../components/LegalPage';

export default function Screen() {
  return (
    <LegalPage
      title="Mentions légales"
      updatedAt="2 novembre 2026"
      sections={[
        {
          title: '1. Éditeur',
          content:
            'Lucas Mezen, entrepreneur individuel exerçant sous le nom commercial TRADIKOM. SIREN : 820 167 914. SIRET du siège : 820 167 914 00028. Adresse : 6 Anse-à-l’Âne, 97229 Les Trois-Îlets, Martinique. Contact : contact@tradikom.com.',
        },
        {
          title: '2. Direction de la publication',
          content: 'Lucas Mezen, éditeur d’OpsPilot.',
        },
        {
          title: '3. Hébergement',
          content:
            'Application web : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. Authentification, base et preuves privées : Supabase, projet hébergé en région eu-west-3 (Paris). La publication historique sur GitHub Pages est remplacée par cette version.',
        },
        {
          title: '4. Propriété intellectuelle',
          content:
            'Les droits sur les contenus du client restent à leurs titulaires. Les composants tiers conservent leurs licences respectives. L’accès au service n’emporte pas de transfert des droits sur l’application.',
        },
        {
          title: '5. Données personnelles et contact',
          content:
            'Les traitements sont décrits dans la politique de confidentialité et l’annexe de sous-traitance. Demandes : contact@tradikom.com.',
        },
      ]}
    />
  );
}
