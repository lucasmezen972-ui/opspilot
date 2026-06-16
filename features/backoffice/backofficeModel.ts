/**
 * Modèle pur du back-office superadmin (multi-organisations).
 *
 * Aucune dépendance UI ni réseau : entièrement testable. Les écrans consomment
 * ces types et fonctions pour piloter commercialement les clients OpsPilot.
 */

export type OrgStatus = 'active' | 'demo' | 'suspended';

export interface OrgAuditSummary {
  title: string;
  score: number | null;
  status: string;
}

export interface OrgActionSummary {
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
}

export interface OrgRoleCount {
  role: string;
  count: number;
}

export interface ClientOrganization {
  id: string;
  name: string;
  status: OrgStatus;
  plan: string;
  sector: string;
  createdAt: string;
  users: number;
  stores: number;
  audits: number;
  openActions: number;
  criticalActions: number;
  completedTrainings: number;
  lastActivityAt: string | null;
  activeModules: string[];
  storeList: string[];
  roleBreakdown: OrgRoleCount[];
  recentAudits: OrgAuditSummary[];
  recentActions: OrgActionSummary[];
}

export interface OrgUsageSummary {
  totalOrganizations: number;
  activeCount: number;
  demoCount: number;
  suspendedCount: number;
  totalUsers: number;
  totalStores: number;
  totalOpenActions: number;
  totalCriticalActions: number;
}

export type AlertSeverity = 'critical' | 'high' | 'medium';

export interface SuperadminAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  orgId: string;
}

export interface OrgConfigStatus {
  score: number;
  label: string;
  isOperational: boolean;
}

export const ORG_STATUS_META: Record<
  OrgStatus,
  { label: string; color: string; bg: string }
> = {
  active: { label: 'Active', color: '#047857', bg: '#ECFDF5' },
  demo: { label: 'Démo', color: '#2563EB', bg: '#EFF6FF' },
  suspended: { label: 'Suspendue', color: '#B91C1C', bg: '#FEF2F2' },
};

export function orgStatusMeta(status: OrgStatus) {
  return ORG_STATUS_META[status];
}

/** Agrège les indicateurs d'usage sur l'ensemble des organisations clientes. */
export function summarizeOrganizations(
  orgs: ClientOrganization[],
): OrgUsageSummary {
  return orgs.reduce<OrgUsageSummary>(
    (acc, org) => ({
      totalOrganizations: acc.totalOrganizations + 1,
      activeCount: acc.activeCount + (org.status === 'active' ? 1 : 0),
      demoCount: acc.demoCount + (org.status === 'demo' ? 1 : 0),
      suspendedCount: acc.suspendedCount + (org.status === 'suspended' ? 1 : 0),
      totalUsers: acc.totalUsers + org.users,
      totalStores: acc.totalStores + org.stores,
      totalOpenActions: acc.totalOpenActions + org.openActions,
      totalCriticalActions: acc.totalCriticalActions + org.criticalActions,
    }),
    {
      totalOrganizations: 0,
      activeCount: 0,
      demoCount: 0,
      suspendedCount: 0,
      totalUsers: 0,
      totalStores: 0,
      totalOpenActions: 0,
      totalCriticalActions: 0,
    },
  );
}

/** Nombre de jours écoulés depuis une date ISO (null si inconnue). */
export function daysSince(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.floor((now - ts) / 86_400_000);
}

/** Libellé court de dernière activité (« aujourd'hui », « il y a 3 j », « — »). */
export function formatLastActivity(
  iso: string | null,
  now = Date.now(),
): string {
  const days = daysSince(iso, now);
  if (days === null) return '—';
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  return `Il y a ${days} j`;
}

const INACTIVITY_ALERT_DAYS = 14;

/**
 * Alertes superadmin priorisées : organisations suspendues, actions critiques
 * ouvertes et clients inactifs depuis plus de deux semaines.
 */
export function buildSuperadminAlerts(
  orgs: ClientOrganization[],
  now = Date.now(),
): SuperadminAlert[] {
  const alerts: SuperadminAlert[] = [];
  for (const org of orgs) {
    if (org.status === 'suspended') {
      alerts.push({
        id: `${org.id}-suspended`,
        severity: 'high',
        title: `${org.name} : compte suspendu`,
        detail: 'Accès client suspendu — régularisation ou contact requis.',
        orgId: org.id,
      });
    }
    if (org.criticalActions > 0) {
      alerts.push({
        id: `${org.id}-critical`,
        severity: 'critical',
        title: `${org.name} : ${org.criticalActions} action(s) critique(s)`,
        detail:
          'Des non-conformités critiques restent ouvertes chez ce client.',
        orgId: org.id,
      });
    }
    const inactivity = daysSince(org.lastActivityAt, now);
    if (
      org.status !== 'suspended' &&
      inactivity !== null &&
      inactivity > INACTIVITY_ALERT_DAYS
    ) {
      alerts.push({
        id: `${org.id}-inactive`,
        severity: 'medium',
        title: `${org.name} : inactif depuis ${inactivity} j`,
        detail: 'Risque de churn — relance commerciale recommandée.',
        orgId: org.id,
      });
    }
  }
  const order: Record<AlertSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
  };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

/**
 * État de configuration opérationnelle d'une organisation : combine présence
 * de magasins, d'utilisateurs, de modules actifs et d'audits réalisés.
 */
export function orgConfigStatus(org: ClientOrganization): OrgConfigStatus {
  const checks = [
    org.stores > 0,
    org.users > 0,
    org.activeModules.length >= 3,
    org.audits > 0,
    org.sector.trim().length > 0,
  ];
  const passed = checks.filter(Boolean).length;
  const score = Math.round((passed / checks.length) * 100);
  const isOperational = score === 100;
  const label = isOperational
    ? 'Opérationnelle'
    : score >= 60
      ? 'À finaliser'
      : 'Configuration incomplète';
  return { score, label, isOperational };
}
