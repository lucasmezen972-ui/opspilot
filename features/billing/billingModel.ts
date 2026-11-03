import type { LucideIcon } from 'lucide-react-native';
import { Crown, Building2, Rocket } from 'lucide-react-native';

export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  description: string;
  badge?: string;
  features: readonly string[];
}

export const PLANS: Plan[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: '299 €',
    period: '/mois',
    icon: Building2,
    color: '#2563EB',
    bg: '#EFF6FF',
    description: '1 magasin · 15 utilisateurs',
    features: [
      'Audits illimités',
      'Contrôle DLC',
      'Actions correctives',
      'Invitations équipe',
      'Export CSV',
      'Support e-mail',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: '799 €',
    period: '/mois',
    icon: Rocket,
    color: '#7C3AED',
    bg: '#F5F3FF',
    description: '5 magasins · 75 utilisateurs',
    badge: 'Populaire',
    features: [
      'Tout Essential +',
      'Dashboard multi-sites',
      'Bibliothèque de modèles avancés',
      'Rapports PDF/Excel',
      'Suivi des actions correctives',
      'Support prioritaire',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Sur devis',
    period: '',
    icon: Crown,
    color: '#D97706',
    bg: '#FFFBEB',
    description: 'Périmètre et accompagnement sur devis',
    features: [
      'Tout Business +',
      'Nombre de sites adapté au contrat',
      'Paramétrage des référentiels',
      'Formation à la prise en main',
      'Accompagnement au déploiement',
    ],
  },
];

const DEFAULT_STATUS = { label: 'Statut à vérifier', color: '#6B7280' };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing: { label: 'Essai gratuit', color: '#2563EB' },
  active: { label: 'Actif', color: '#16A34A' },
  past_due: { label: 'Paiement en retard', color: '#DC2626' },
  canceled: { label: 'Annulé', color: '#6B7280' },
};

const PLAN_ORDER: Record<string, number> = {
  trial: 0,
  essential: 1,
  business: 2,
  enterprise: 3,
};

export function getStatusInfo(status: string): {
  label: string;
  color: string;
} {
  return STATUS_LABELS[status] ?? DEFAULT_STATUS;
}

/** Libellé français de l’essai ; noms commerciaux conservés pour les offres. */
export function formatPlanName(plan: string): string {
  if (plan === 'trial') return 'Essai';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export const SALES_CONTACT_EMAIL = 'contact@tradikom.com';

/**
 * URL mailto de demande d'activation : alternative claire au paiement en ligne
 * quand le paiement Qonto n'est pas configuré sur l'instance (jamais un cul-de-sac).
 */
export function buildActivationMailtoUrl(planId: string): string {
  const subject = encodeURIComponent(`Activation offre OpsPilot — ${planId}`);
  const body = encodeURIComponent(
    `Bonjour,\n\nNous souhaitons activer l'offre « ${planId} » pour notre organisation.\n\nMerci de nous recontacter pour finaliser la souscription.`,
  );
  return `mailto:${SALES_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export interface PlanState {
  isCurrent: boolean;
  isDowngrade: boolean;
}

/** Position d'un plan vis-à-vis du plan courant (actuel / rétrogradation). */
export function getPlanState(planId: string, currentPlan: string): PlanState {
  const isCurrent = currentPlan === planId;
  const isDowngrade =
    (PLAN_ORDER[planId] ?? 0) < (PLAN_ORDER[currentPlan] ?? 0);
  return { isCurrent, isDowngrade };
}
