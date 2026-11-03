import LegalPage from '../../components/LegalPage';

export default function Screen() {
  return (
    <LegalPage
      title="Conditions commerciales professionnelles"
      updatedAt="2 novembre 2026"
      sections={[
        {
          title: '1. Prestataire et clients',
          content:
            'Le service OpsPilot est proposé par Lucas Mezen, EI TRADIKOM, SIREN 820 167 914, aux organisations agissant pour leurs besoins professionnels. Le devis ou bon de commande identifie le client, les sites, les utilisateurs et les modules souscrits.',
        },
        {
          title: '2. Formation du contrat',
          content:
            'La souscription nécessite l’acceptation écrite du devis ou bon de commande, des présentes conditions, des CGU et de l’annexe de sous-traitance. Une démonstration ou une demande de facture ne vaut pas souscription. Les conditions particulières acceptées priment en cas de divergence.',
        },
        {
          title: '3. Périmètre du service',
          content:
            'Le contrat porte sur les modules expressément retenus : audits, tâches, actions correctives, catalogue produits, formation et rapports. Une certification réglementaire, un SSO, un hébergement dédié ou un engagement de disponibilité chiffré nécessitent un accord spécifique. Les attestations de formation internes ne constituent pas un diplôme ou une certification reconnue.',
        },
        {
          title: '4. Prix et règlement avec Qonto',
          content:
            'Le devis accepté et la facture Qonto indiquent le prix, les taxes applicables ou la mention d’exonération et le total à régler. Le règlement s’effectue par le moyen proposé sur la facture Qonto ou par le lien Mollie associé à cette facture dans OpsPilot. Les données de carte sont saisies sur la page sécurisée du prestataire et ne sont jamais collectées dans OpsPilot. Une demande ou un retour de page de paiement ne prouve pas un règlement : l’accès payant est activé après vérification du paiement. Le paiement proposé couvre la période indiquée sur la facture et ne constitue pas un mandat de prélèvement automatique.',
        },
        {
          title: '5. Durée et résiliation',
          content:
            'Sauf condition particulière acceptée, l’abonnement est mensuel et sans durée minimale d’engagement. Chaque période est facturée d’avance. Le client peut demander la non-reconduction à contact@tradikom.com avant le début de la période suivante. La période en cours reste due, sous réserve des dispositions impératives et d’un manquement du prestataire.',
        },
        {
          title: '6. Support et disponibilité',
          content:
            'Le support est joignable à contact@tradikom.com. Les délais et engagements particuliers figurent au devis ; aucun SLA de 99,9 % n’est inclus par défaut. Les maintenances affectant le service sont annoncées lorsque cela est possible.',
        },
        {
          title: '7. Données et réversibilité',
          content:
            'Le client conserve la propriété de ses données et peut demander un export pendant le contrat et dans les 30 jours suivant sa fin. Les données métier sont ensuite supprimées de la base active dans un délai maximal de 90 jours, sauf obligation légale ou instruction écrite convenue. Le sort des sauvegardes et les mesures de protection sont précisés dans l’annexe de sous-traitance.',
        },
        {
          title: '8. Impayés et suspension',
          content:
            'En cas de retard, le prestataire adresse une notification permettant au client de régulariser. Les pénalités et frais de recouvrement applicables sont indiqués sur le devis et la facture. Une suspension peut intervenir pour impayé persistant, risque de sécurité ou usage illicite ; elle n’efface pas les sommes dues ni le droit à la restitution des données selon le contrat.',
        },
        {
          title: '9. Responsabilités',
          content:
            'Le client définit ses procédures de contrôle, l’accès des salariés et la durée de conservation de ses documents. OpsPilot aide à organiser et tracer les opérations ; il ne garantit pas la conformité réglementaire de l’activité. Les obligations impératives et la responsabilité en cas de faute ne sont pas écartées par les présentes conditions.',
        },
        {
          title: '10. Droit applicable et litiges',
          content:
            'Le contrat est soumis au droit français. Toute difficulté est d’abord signalée à contact@tradikom.com pour rechercher une solution amiable. À défaut, les juridictions compétentes sont déterminées par les règles applicables, sans clause attributive particulière.',
        },
      ]}
    />
  );
}
