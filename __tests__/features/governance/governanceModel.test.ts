import { describe, it, expect } from 'vitest';

import {
  activityCategoryLabel,
  canEditAudit,
  filterActivity,
  isAuditLocked,
  isTrainingCertified,
  sortActivity,
} from '../../../features/governance/governanceModel';
import type { ActivityEvent } from '../../../lib/supabase';

describe('governanceModel', () => {
  it('verrouille un audit terminé ou annulé', () => {
    expect(isAuditLocked({ status: 'completed' })).toBe(true);
    expect(isAuditLocked({ status: 'cancelled' })).toBe(true);
    expect(isAuditLocked({ status: 'in_progress' })).toBe(false);
    expect(isAuditLocked({ status: 'pending' })).toBe(false);
  });

  it("canEditAudit est l'inverse du verrou", () => {
    expect(canEditAudit({ status: 'in_progress' })).toBe(true);
    expect(canEditAudit({ status: 'completed' })).toBe(false);
  });

  it('considère une formation terminée comme certifiée', () => {
    expect(isTrainingCertified({ status: 'completed' })).toBe(true);
    expect(isTrainingCertified({ status: 'in_progress' })).toBe(false);
    expect(isTrainingCertified(null)).toBe(false);
    expect(isTrainingCertified(undefined)).toBe(false);
  });

  it('libelle les catégories d’activité', () => {
    expect(activityCategoryLabel('audit_completed')).toBe('Audit clôturé');
    expect(activityCategoryLabel('export')).toBe('Export');
  });

  it('trie les événements du plus récent au plus ancien', () => {
    const ev = (id: string, at: string): ActivityEvent => ({
      id,
      organization_id: 'o',
      action: 'export',
      entity_type: 'report',
      label: 'x',
      created_at: at,
    });
    const sorted = sortActivity([
      ev('a', '2026-06-10T00:00:00Z'),
      ev('b', '2026-06-14T00:00:00Z'),
      ev('c', '2026-06-12T00:00:00Z'),
    ]);
    expect(sorted.map((e) => e.id)).toEqual(['b', 'c', 'a']);
  });

  it('filtre les événements par type', () => {
    const base = {
      organization_id: 'o',
      entity_type: 'x',
      label: 'x',
      created_at: '2026-06-14T00:00:00Z',
    };
    const events: ActivityEvent[] = [
      { ...base, id: '1', action: 'audit_completed' },
      { ...base, id: '2', action: 'export' },
      { ...base, id: '3', action: 'audit_completed' },
    ];
    expect(filterActivity(events, 'all')).toHaveLength(3);
    expect(filterActivity(events, 'audit_completed').map((e) => e.id)).toEqual([
      '1',
      '3',
    ]);
    expect(filterActivity(events, 'export')).toHaveLength(1);
    expect(filterActivity(events, 'action_resolved')).toHaveLength(0);
  });
});
