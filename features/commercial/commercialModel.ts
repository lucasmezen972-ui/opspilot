export type CommercialPlanId = 'starter' | 'pro' | 'franchise';

export type CommercialPlan = {
  id: CommercialPlanId;
  name: string;
  price: string;
  target: string;
  description: string;
  limits: string[];
  highlights: string[];
  cta: string;
};

export type CommercialKpi = {
  label: string;
  value: string;
  detail: string;
};

export const COMMERCIAL_CONTACT_EMAIL = 'contact@tradikom.com';

export const COMMERCIAL_KPIS: CommercialKpi[] = [
  {
    label: 'Audit terrain',
    value: '15 min',
    detail: 'pour lancer un contrôle guidé et contextualisé',
  },
  {
    label: 'Actions critiques',
    value: '100 %',
    detail: 'suivies avec preuve et validation manager',
  },
  {
    label: 'Formation magasin',
    value: '45–90 min',
    detail: 'par module métier quasi-certifiant',
  },
];

export const COMMERCIAL_PLANS: CommercialPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '299 € / mois',
    target: '1 magasin',
    description:
      'Pour lancer les audits, actions correctives et formations dans un point de vente.',
    limits: [
      '1 magasin',
      '15 utilisateurs',
      'Audits et actions illimités',
      'Support e-mail',
    ],
    highlights: [
      'Audit parking / HACCP / DLC',
      'Preuves de clôture',
      'Attestations formation',
    ],
    cta: 'Demander une démo Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '799 € / mois',
    target: 'jusqu’à 5 magasins',
    description:
      'Pour piloter plusieurs sites avec reporting direction et supervision formation.',
    limits: [
      '5 magasins',
      '75 utilisateurs',
      'Rapports PDF/CSV',
      'Support prioritaire',
    ],
    highlights: [
      'Back-office multi-organisations',
      'KPIs conformité',
      'Plans d’action centralisés',
    ],
    cta: 'Demander une démo Pro',
  },
  {
    id: 'franchise',
    name: 'Franchise',
    price: 'Sur devis',
    target: 'réseau multi-sites',
    description:
      'Pour réseaux, franchises ou directions régionales avec accompagnement dédié.',
    limits: [
      'Magasins illimités',
      'Utilisateurs illimités',
      'Onboarding accompagné',
      'SLA sur devis',
    ],
    highlights: [
      'Déploiement réseau',
      'Modèles métier personnalisés',
      'Support direction',
    ],
    cta: 'Demander un devis Franchise',
  },
];

export const SALES_STEPS = [
  'Démo guidée sur un magasin témoin',
  'Configuration secteur, modules et premier manager',
  'Import ou création des premiers audits et formations',
  'Go-live avec suivi des actions critiques',
] as const;

export function buildCommercialMailto(planId?: CommercialPlanId): string {
  const plan = COMMERCIAL_PLANS.find((item) => item.id === planId);
  const subject = plan
    ? `Démo OpsPilot — Offre ${plan.name}`
    : 'Démo OpsPilot — Demande commerciale';
  const body = [
    'Bonjour,',
    '',
    plan
      ? `Je souhaite planifier une démonstration OpsPilot pour l’offre ${plan.name}.`
      : 'Je souhaite planifier une démonstration OpsPilot.',
    '',
    'Contexte :',
    '- Nombre de magasins :',
    '- Nombre d’utilisateurs :',
    '- Modules prioritaires : audits / actions / formations / DLC / rapports',
    '',
    'Merci,',
  ].join('\n');

  return `mailto:${COMMERCIAL_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function hasNoDeadCommercialCta(plans = COMMERCIAL_PLANS): boolean {
  return plans.every(
    (plan) =>
      plan.cta.trim().length > 0 &&
      buildCommercialMailto(plan.id).startsWith(
        `mailto:${COMMERCIAL_CONTACT_EMAIL}`,
      ),
  );
}
