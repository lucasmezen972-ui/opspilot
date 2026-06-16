import type { ClientOrganization, OrgStatus } from './backofficeModel';

const STATUSES: OrgStatus[] = ['active', 'demo', 'suspended'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

type Payload = Record<string, unknown>;

type ActionPriority = ClientOrganization['recentActions'][number]['priority'];

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : fallback;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asStatus(value: unknown): OrgStatus {
  return STATUSES.includes(value as OrgStatus) ? (value as OrgStatus) : 'active';
}

function asPriority(value: unknown): ActionPriority {
  return PRIORITIES.includes(value as ActionPriority)
    ? (value as ActionPriority)
    : 'medium';
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function asRoleBreakdown(value: unknown): ClientOrganization['roleBreakdown'] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const payload = item as Payload;
      return {
        role: asString(payload.role, 'utilisateur'),
        count: asNumber(payload.count),
      };
    })
    .filter((item) => item.count > 0);
}

function asRecentAudits(value: unknown): ClientOrganization['recentAudits'] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const payload = item as Payload;
    return {
      title: asString(payload.title, 'Audit'),
      score: typeof payload.score === 'number' ? payload.score : null,
      status: asString(payload.status, 'pending'),
    };
  });
}

function asRecentActions(value: unknown): ClientOrganization['recentActions'] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const payload = item as Payload;
    return {
      title: asString(payload.title, 'Action corrective'),
      priority: asPriority(payload.priority),
      status: asString(payload.status, 'open'),
    };
  });
}

export function normalizeOrganizationPortfolio(
  payload: unknown,
): ClientOrganization[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item): ClientOrganization => {
      const org = item as Payload;
      return {
        id: asString(org.id),
        name: asString(org.name, 'Organisation'),
        status: asStatus(org.status),
        plan: asString(org.plan, 'trial'),
        sector: asString(org.sector, 'Non renseigné'),
        createdAt: asString(org.createdAt, new Date(0).toISOString()),
        users: asNumber(org.users),
        stores: asNumber(org.stores),
        audits: asNumber(org.audits),
        openActions: asNumber(org.openActions),
        criticalActions: asNumber(org.criticalActions),
        completedTrainings: asNumber(org.completedTrainings),
        lastActivityAt:
          typeof org.lastActivityAt === 'string' ? org.lastActivityAt : null,
        activeModules: asStringArray(org.activeModules),
        storeList: asStringArray(org.storeList),
        roleBreakdown: asRoleBreakdown(org.roleBreakdown),
        recentAudits: asRecentAudits(org.recentAudits),
        recentActions: asRecentActions(org.recentActions),
      };
    })
    .filter((org) => org.id.length > 0);
}
