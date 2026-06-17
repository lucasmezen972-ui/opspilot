import type { LucideIcon } from 'lucide-react-native';
import {
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Wrench,
  Package,
} from 'lucide-react-native';

import type { Audit, CorrectiveAction, Product } from '../../lib/supabase';

const DAY_MS = 86_400_000;

export type DashboardRoute = '/actions' | '/audits' | '/products';

/** Carte KPI du tableau de bord (déjà résolue : valeur + couleurs). */
export interface DashboardKpi {
  id: string;
  label: string;
  value: number;
  /** Couleur d'accent (verte si au vert, sinon couleur de criticité). */
  accent: string;
  accentSoft: string;
  icon: LucideIcon;
}

export interface DashboardFieldBrief {
  tone: 'danger' | 'warning' | 'success';
  eyebrow: string;
  title: string;
  message: string;
  proof: string;
  actionLabel: string;
  route: DashboardRoute;
  trustLine: string;
}

const GREEN = '#10B981';
const GREEN_SOFT = '#DCFCE7';

/**
 * Calcule les indicateurs du jour à partir des données brutes. Logique pure et
 * testable : aucune dépendance à l'UI ni aux hooks.
 */
export function getDashboardKpis(
  audits: Audit[],
  actions: CorrectiveAction[],
  products: Product[],
  now: Date,
): DashboardKpi[] {
  const auditsCompleted = audits.filter((a) => a.status === 'completed').length;

  const auditsOverdue = audits.filter(
    (a) =>
      (a.status === 'pending' || a.status === 'in_progress') &&
      a.due_date != null &&
      new Date(a.due_date) < now,
  ).length;

  const actionsOpen = actions.filter(
    (a) => a.status === 'open' || a.status === 'in_progress',
  ).length;

  const actionsCritical = actions.filter(
    (a) =>
      a.priority === 'critical' &&
      a.status !== 'done' &&
      a.status !== 'cancelled',
  ).length;

  const dlcLimit = new Date(now.getTime() + 3 * DAY_MS);
  const dlcCritical = products.filter(
    (p) => p.dlc != null && new Date(p.dlc) <= dlcLimit,
  ).length;

  return [
    {
      id: 'audits-done',
      label: 'Contrôles validés',
      value: auditsCompleted,
      accent: GREEN,
      accentSoft: GREEN_SOFT,
      icon: CheckCircle,
    },
    {
      id: 'audits-overdue',
      label: 'Contrôles à rattraper',
      value: auditsOverdue,
      accent: auditsOverdue > 0 ? '#EF4444' : GREEN,
      accentSoft: auditsOverdue > 0 ? '#FEE2E2' : GREEN_SOFT,
      icon: AlertTriangle,
    },
    {
      id: 'actions-open',
      label: 'Plans à suivre',
      value: actionsOpen,
      accent: actionsOpen > 0 ? '#F59E0B' : GREEN,
      accentSoft: actionsOpen > 0 ? '#FEF3C7' : GREEN_SOFT,
      icon: Wrench,
    },
    {
      id: 'actions-critical',
      label: 'Actions à sécuriser',
      value: actionsCritical,
      accent: actionsCritical > 0 ? '#DC2626' : GREEN,
      accentSoft: actionsCritical > 0 ? '#FEE2E2' : GREEN_SOFT,
      icon: AlertTriangle,
    },
    {
      id: 'dlc-critical',
      label: 'DLC à traiter',
      value: dlcCritical,
      accent: dlcCritical > 0 ? '#EF4444' : GREEN,
      accentSoft: dlcCritical > 0 ? '#FEE2E2' : GREEN_SOFT,
      icon: Package,
    },
  ];
}

function sortByDueDate<T extends { due_date?: string | null }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    return aDate - bDate;
  });
}

function buildTrustLine(audits: Audit[], actions: CorrectiveAction[]): string {
  const completedAudits = audits.filter(
    (audit) => audit.status === 'completed',
  );
  const tracedActions = actions.filter(
    (action) =>
      action.status === 'done' &&
      (Boolean(action.resolution_comment?.trim()) ||
        Boolean(action.resolved_by_name?.trim()) ||
        Boolean(action.resolution_photo_confirmed) ||
        Boolean(action.manager_validated)),
  );

  if (completedAudits.length === 0 && tracedActions.length === 0) {
    return 'Démo prête : lancez un contrôle pour créer les premières preuves.';
  }

  return `${completedAudits.length} contrôle${completedAudits.length > 1 ? 's' : ''} validé${completedAudits.length > 1 ? 's' : ''} · ${tracedActions.length} action${tracedActions.length > 1 ? 's' : ''} tracée${tracedActions.length > 1 ? 's' : ''}`;
}

export function getDashboardFieldBrief(
  audits: Audit[],
  actions: CorrectiveAction[],
  products: Product[],
  now: Date,
): DashboardFieldBrief {
  const trustLine = buildTrustLine(audits, actions);
  const criticalAction = sortByDueDate(
    actions.filter(
      (action) =>
        action.priority === 'critical' &&
        action.status !== 'done' &&
        action.status !== 'cancelled',
    ),
  )[0];

  if (criticalAction) {
    const actionDescription = criticalAction.description?.trim();
    return {
      tone: 'danger',
      eyebrow: 'À sécuriser maintenant',
      title: criticalAction.title,
      message:
        actionDescription && actionDescription.length > 0
          ? actionDescription
          : 'Une non-conformité critique attend une prise en charge terrain.',
      proof:
        'Preuve attendue : commentaire de clôture, exécutant identifié et validation manager.',
      actionLabel: 'Ouvrir les actions',
      route: '/actions',
      trustLine,
    };
  }

  const overdueAudit = sortByDueDate(
    audits.filter(
      (audit) =>
        (audit.status === 'pending' || audit.status === 'in_progress') &&
        audit.due_date != null &&
        new Date(audit.due_date) < now,
    ),
  )[0];

  if (overdueAudit) {
    return {
      tone: 'warning',
      eyebrow: 'Contrôle à reprendre',
      title: overdueAudit.title,
      message: overdueAudit.location
        ? `Zone concernée : ${overdueAudit.location}. Le contrôle doit être repris avant la tournée suivante.`
        : 'Un contrôle terrain est en retard et doit être repris avant la tournée suivante.',
      proof:
        'Preuve attendue : réponses complètes, commentaire si écart et photo si nécessaire.',
      actionLabel: 'Reprendre l’audit',
      route: '/audits',
      trustLine,
    };
  }

  const urgentDlc = getDlcAlerts(products, now)[0];

  if (urgentDlc?.dlc) {
    const urgency = getDlcUrgency(urgentDlc.dlc, now);
    return {
      tone: urgency.isExpired || urgency.isToday ? 'danger' : 'warning',
      eyebrow: 'DLC à vérifier',
      title: urgentDlc.name,
      message: `${urgentDlc.name} est signalé ${urgency.label.toLowerCase()} : vérifiez le rayon, la rotation et le retrait si nécessaire.`,
      proof:
        'Preuve attendue : stock contrôlé, décision tracée et rayon remis au propre.',
      actionLabel: 'Voir les produits',
      route: '/products',
      trustLine,
    };
  }

  return {
    tone: 'success',
    eyebrow: 'Terrain maîtrisé',
    title: 'Les priorités sensibles sont sous contrôle',
    message:
      'Les contrôles, actions critiques et alertes DLC ne signalent pas de blocage immédiat.',
    proof:
      'Rythme conseillé : garder les preuves à jour et lancer le prochain contrôle planifié.',
    actionLabel: 'Préparer un audit',
    route: '/audits',
    trustLine,
  };
}

/** Cinq produits dont la DLC tombe dans les 7 jours, du plus urgent au moins. */
export function getDlcAlerts(products: Product[], now: Date): Product[] {
  const limit = new Date(now.getTime() + 7 * DAY_MS);
  return products
    .filter((p) => p.dlc != null && new Date(p.dlc) <= limit)
    .sort((a, b) => new Date(a.dlc!).getTime() - new Date(b.dlc!).getTime())
    .slice(0, 5);
}

/** Descripteur visuel d'urgence d'une alerte DLC (couleurs + libellé). */
export interface DlcUrgency {
  diffDays: number;
  isExpired: boolean;
  isToday: boolean;
  color: string;
  iconBg: string;
  badgeBg: string;
  label: string;
}

export function getDlcUrgency(dlc: string, now: Date): DlcUrgency {
  const diffDays = Math.ceil(
    (new Date(dlc).getTime() - now.getTime()) / DAY_MS,
  );
  const isExpired = diffDays < 0;
  const isToday = diffDays === 0;
  const color = isExpired
    ? '#EF4444'
    : isToday
      ? '#F59E0B'
      : diffDays <= 2
        ? '#F97316'
        : '#6B7280';
  const iconBg = isExpired ? '#FEE2E2' : isToday ? '#FEF3C7' : '#F3F4F6';
  const badgeBg = isExpired ? '#FEE2E2' : isToday ? '#FEF3C7' : '#FFF7ED';
  const label = isExpired
    ? 'Expiré'
    : isToday
      ? "Aujourd'hui"
      : `J−${diffDays}`;
  return { diffDays, isExpired, isToday, color, iconBg, badgeBg, label };
}
