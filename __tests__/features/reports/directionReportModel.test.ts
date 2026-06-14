import { describe, it, expect } from 'vitest';

import {
  buildEvolution,
  buildSiteConformity,
  directionReportRows,
} from '../../../features/reports/directionReportModel';
import type { Audit } from '../../../lib/supabase';

const NOW = new Date('2026-06-14T12:00:00Z').getTime();
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

const audit = (over: Partial<Audit>): Audit =>
  ({
    id: Math.random().toString(36).slice(2),
    organization_id: 'o',
    auditor_id: 'u',
    title: 'Audit',
    status: 'pending',
    max_score: 100,
    issues_count: 0,
    photos: [],
    created_at: daysAgo(100),
    updated_at: daysAgo(100),
    ...over,
  }) as Audit;

describe('buildSiteConformity', () => {
  it('regroupe par localisation et calcule la conformité des audits clôturés', () => {
    const rows = buildSiteConformity([
      audit({
        location: 'Rayon frais',
        status: 'completed',
        score: 80,
        issues_count: 1,
      }),
      audit({
        location: 'Rayon frais',
        status: 'completed',
        score: 90,
        issues_count: 0,
      }),
      audit({ location: 'Rayon frais', status: 'pending', issues_count: 2 }),
      audit({ location: 'Réserve', status: 'in_progress' }),
    ]);
    const frais = rows.find((r) => r.site === 'Rayon frais');
    expect(frais?.audits).toBe(3);
    expect(frais?.completed).toBe(2);
    expect(frais?.conformity).toBe(85);
    expect(frais?.nonConformities).toBe(3);
    const reserve = rows.find((r) => r.site === 'Réserve');
    expect(reserve?.conformity).toBeNull();
  });

  it('regroupe les audits sans localisation sous « Site principal »', () => {
    const rows = buildSiteConformity([audit({ location: null })]);
    expect(rows[0]?.site).toBe('Site principal');
  });
});

describe('buildEvolution', () => {
  it('compte les audits clôturés sur 30 et 90 jours', () => {
    const evo = buildEvolution(
      [
        audit({ status: 'completed', score: 90, completed_at: daysAgo(10) }),
        audit({ status: 'completed', score: 70, completed_at: daysAgo(45) }),
        audit({ status: 'completed', score: 60, completed_at: daysAgo(200) }),
        audit({ status: 'in_progress' }),
      ],
      NOW,
    );
    expect(evo.completed30d).toBe(1);
    expect(evo.completed90d).toBe(2);
    expect(evo.conformity30d).toBe(90);
  });
});

describe('directionReportRows', () => {
  it('aplatit les lignes pour export', () => {
    const rows = directionReportRows([
      {
        site: 'Rayon frais',
        audits: 3,
        completed: 2,
        conformity: 85,
        nonConformities: 3,
      },
    ]);
    expect(rows[0]).toEqual({
      Site: 'Rayon frais',
      Audits: 3,
      Terminés: 2,
      'Conformité (%)': 85,
      'Non-conformités': 3,
    });
  });
});
