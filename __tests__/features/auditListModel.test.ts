import { describe, it, expect } from 'vitest';

import {
  toAuditListItems,
  getAuditStatusText,
  getAuditStatusColor,
} from '../../features/audits/auditListModel';
import type { Audit } from '../../lib/supabase';

const audit = (over: Partial<Audit>): Audit =>
  ({
    id: 'a1',
    organization_id: 'org',
    title: 'Contrôle hygiène',
    location: 'Rayon frais',
    status: 'pending',
    created_at: '2026-01-01T00:00:00Z',
    score: null,
    issues_count: 0,
    ...over,
  }) as Audit;

describe('auditListModel', () => {
  it('projette et formate les audits', () => {
    const [item] = toAuditListItems([audit({})], '', 'all');
    expect(item.title).toBe('Contrôle hygiène');
    expect(item.date).not.toBe('');
  });

  it('filtre par recherche sur titre et lieu', () => {
    const list = [
      audit({ id: 'a1', title: 'Hygiène' }),
      audit({ id: 'a2', title: 'Sécurité' }),
    ];
    expect(toAuditListItems(list, 'hygiène', 'all')).toHaveLength(1);
    expect(toAuditListItems(list, 'rayon frais', 'all')).toHaveLength(2);
  });

  it('filtre par statut', () => {
    const list = [
      audit({ id: 'a1', status: 'completed' }),
      audit({ id: 'a2', status: 'pending' }),
    ];
    expect(toAuditListItems(list, '', 'completed')).toHaveLength(1);
  });

  it('expose libellé et couleur de statut', () => {
    expect(getAuditStatusText('completed')).toBe('Terminé');
    expect(getAuditStatusColor('in_progress')).toMatch(/^#/);
  });
});
