import { describe, it, expect } from 'vitest';

import {
  getCompletedAudits,
  getAverageScore,
  getConformityRate,
  buildReportStats,
} from '../../features/reports/reportsModel';
import type { Audit, CorrectiveAction } from '../../lib/supabase';

function audit(p: Partial<Audit>): Audit {
  return {
    id: 'a',
    organization_id: 'org',
    auditor_id: 'u',
    title: 'Audit',
    status: 'completed',
    max_score: 100,
    issues_count: 0,
    photos: [],
    created_at: '',
    updated_at: '',
    ...p,
  };
}

function action(p: Partial<CorrectiveAction>): CorrectiveAction {
  return {
    id: 'c',
    organization_id: 'org',
    title: 'Action',
    priority: 'medium',
    status: 'open',
    ...p,
  };
}

describe('getAverageScore', () => {
  it('moyenne des audits notés, null si aucun', () => {
    expect(getAverageScore([audit({ score: 80 }), audit({ score: 60 })])).toBe(
      70,
    );
    expect(getAverageScore([audit({ score: null })])).toBeNull();
  });
});

describe('getConformityRate', () => {
  it('part des audits ≥ 80 %', () => {
    const completed = [
      audit({ score: 90 }),
      audit({ score: 50 }),
      audit({ score: 85 }),
      audit({ score: 70 }),
    ];
    expect(getConformityRate(completed)).toBe(50);
    expect(getConformityRate([])).toBeNull();
  });
});

describe('buildReportStats', () => {
  it('produit six indicateurs cohérents', () => {
    const audits = [
      audit({ id: 'a1', status: 'completed', score: 90, issues_count: 2 }),
      audit({ id: 'a2', status: 'pending', issues_count: 1 }),
    ];
    const actions = [
      action({ id: 'c1', status: 'open' }),
      action({ id: 'c2', status: 'done' }),
    ];
    const stats = buildReportStats(audits, actions);
    const byLabel = Object.fromEntries(stats.map((s) => [s.label, s.value]));
    expect(byLabel['Audits terminés']).toBe(1);
    expect(byLabel['Score moyen']).toBe('90%');
    expect(byLabel['Actions ouvertes']).toBe(1);
    expect(byLabel['Actions résolues']).toBe(1);
    expect(byLabel['Non-conformités']).toBe(3);
  });
});

describe('getCompletedAudits', () => {
  it('ne garde que les audits terminés', () => {
    const result = getCompletedAudits([
      audit({ id: 'a1', status: 'completed' }),
      audit({ id: 'a2', status: 'pending' }),
    ]);
    expect(result.map((a) => a.id)).toEqual(['a1']);
  });
});
