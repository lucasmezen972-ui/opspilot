import { describe, it, expect } from 'vitest';

import {
  buildSuperadminAlerts,
  formatLastActivity,
  orgConfigStatus,
  summarizeOrganizations,
  type ClientOrganization,
} from '../../../features/backoffice/backofficeModel';
import { getDemoClientOrganizations } from '../../../lib/demoData';

describe('back-office superadmin — données démo', () => {
  const orgs = getDemoClientOrganizations();

  it('expose plusieurs organisations clientes (≥ 3)', () => {
    expect(orgs.length).toBeGreaterThanOrEqual(3);
    expect(new Set(orgs.map((o) => o.id)).size).toBe(orgs.length);
  });

  it('couvre les statuts active / démo / suspendue et plusieurs plans', () => {
    const statuses = new Set(orgs.map((o) => o.status));
    expect(statuses.has('active')).toBe(true);
    expect(statuses.has('demo')).toBe(true);
    expect(statuses.has('suspended')).toBe(true);
    expect(new Set(orgs.map((o) => o.plan)).size).toBeGreaterThanOrEqual(2);
  });

  it('aucune organisation démo n’a de détail vide (pas d’écran vide)', () => {
    for (const org of orgs) {
      expect(org.storeList.length).toBeGreaterThan(0);
      expect(org.roleBreakdown.length).toBeGreaterThan(0);
      expect(org.recentAudits.length).toBeGreaterThan(0);
      expect(org.recentActions.length).toBeGreaterThan(0);
      expect(org.activeModules.length).toBeGreaterThan(0);
    }
  });
});

describe('summarizeOrganizations', () => {
  it('agrège statuts et usages de façon cohérente', () => {
    const orgs = getDemoClientOrganizations();
    const summary = summarizeOrganizations(orgs);
    expect(summary.totalOrganizations).toBe(orgs.length);
    expect(
      summary.activeCount + summary.demoCount + summary.suspendedCount,
    ).toBe(orgs.length);
    expect(summary.totalUsers).toBe(orgs.reduce((sum, o) => sum + o.users, 0));
    expect(summary.suspendedCount).toBeGreaterThanOrEqual(1);
  });
});

describe('buildSuperadminAlerts', () => {
  function org(p: Partial<ClientOrganization>): ClientOrganization {
    return {
      id: 'o',
      name: 'Org',
      status: 'active',
      plan: 'business',
      sector: 'Supermarché',
      createdAt: new Date().toISOString(),
      users: 10,
      stores: 1,
      audits: 10,
      openActions: 0,
      criticalActions: 0,
      completedTrainings: 5,
      lastActivityAt: new Date().toISOString(),
      activeModules: ['audits', 'actions', 'trainings'],
      storeList: ['S'],
      roleBreakdown: [{ role: 'admin', count: 1 }],
      recentAudits: [{ title: 'A', score: 90, status: 'completed' }],
      recentActions: [{ title: 'X', priority: 'low', status: 'open' }],
      ...p,
    };
  }

  it('signale clairement une organisation suspendue', () => {
    const alerts = buildSuperadminAlerts([
      org({ id: 'sus', status: 'suspended' }),
    ]);
    expect(alerts.some((a) => a.id === 'sus-suspended')).toBe(true);
  });

  it('remonte les actions critiques en priorité haute', () => {
    const alerts = buildSuperadminAlerts([
      org({ id: 'crit', criticalActions: 3 }),
    ]);
    expect(alerts[0]?.severity).toBe('critical');
  });

  it('alerte sur un client actif inactif depuis plus de 14 jours', () => {
    const old = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const alerts = buildSuperadminAlerts([
      org({ id: 'idle', lastActivityAt: old }),
    ]);
    expect(alerts.some((a) => a.id === 'idle-inactive')).toBe(true);
  });

  it('aucune alerte pour un client actif et récent', () => {
    expect(buildSuperadminAlerts([org({})])).toEqual([]);
  });
});

describe('orgConfigStatus & formatLastActivity', () => {
  it('considère une organisation complète comme opérationnelle', () => {
    const org = getDemoClientOrganizations()[0]!;
    const status = orgConfigStatus(org);
    expect(status.score).toBe(100);
    expect(status.isOperational).toBe(true);
  });

  it('formate la dernière activité de façon lisible', () => {
    expect(formatLastActivity(null)).toBe('—');
    const now = Date.now();
    expect(formatLastActivity(new Date(now).toISOString(), now)).toBe(
      "Aujourd'hui",
    );
    expect(
      formatLastActivity(new Date(now - 3 * 86_400_000).toISOString(), now),
    ).toBe('Il y a 3 j');
  });
});
