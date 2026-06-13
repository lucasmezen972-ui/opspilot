import type { LucideIcon } from 'lucide-react-native';
import {
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Wrench,
  Package,
} from 'lucide-react-native';

import type { Audit, CorrectiveAction, Product } from '../../lib/supabase';

const DAY_MS = 86_400_000;

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

const GREEN = '#10B981';
const GREEN_SOFT = '#DCFCE7';

/**
 * Calcule les KPIs du jour à partir des données brutes. Logique pure et
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
      label: 'Audits réalisés',
      value: auditsCompleted,
      accent: GREEN,
      accentSoft: GREEN_SOFT,
      icon: CheckCircle,
    },
    {
      id: 'audits-overdue',
      label: 'Audits en retard',
      value: auditsOverdue,
      accent: auditsOverdue > 0 ? '#EF4444' : GREEN,
      accentSoft: auditsOverdue > 0 ? '#FEE2E2' : GREEN_SOFT,
      icon: AlertTriangle,
    },
    {
      id: 'actions-open',
      label: 'Actions ouvertes',
      value: actionsOpen,
      accent: actionsOpen > 0 ? '#F59E0B' : GREEN,
      accentSoft: actionsOpen > 0 ? '#FEF3C7' : GREEN_SOFT,
      icon: Wrench,
    },
    {
      id: 'actions-critical',
      label: 'Actions critiques',
      value: actionsCritical,
      accent: actionsCritical > 0 ? '#DC2626' : GREEN,
      accentSoft: actionsCritical > 0 ? '#FEE2E2' : GREEN_SOFT,
      icon: AlertTriangle,
    },
    {
      id: 'dlc-critical',
      label: 'DLC critiques',
      value: dlcCritical,
      accent: dlcCritical > 0 ? '#EF4444' : GREEN,
      accentSoft: dlcCritical > 0 ? '#FEE2E2' : GREEN_SOFT,
      icon: Package,
    },
  ];
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
