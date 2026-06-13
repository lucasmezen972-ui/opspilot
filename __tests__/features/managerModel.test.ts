import { describe, it, expect } from 'vitest';

import {
  computeManagerStats,
  computeStoreStats,
  getUrgentTasks,
  getScoreChip,
} from '../../features/manager/managerModel';
import type { Audit, Store, Task } from '../../lib/supabase';

function audit(p: Partial<Audit>): Audit {
  return {
    id: 'a',
    organization_id: 'org',
    auditor_id: 'u',
    title: 'Audit',
    status: 'pending',
    max_score: 100,
    issues_count: 0,
    photos: [],
    created_at: '',
    updated_at: '',
    ...p,
  };
}

function task(p: Partial<Task>): Task {
  return {
    id: 't',
    organization_id: 'org',
    title: 'Tâche',
    priority: 'medium',
    status: 'pending',
    ...p,
  };
}

describe('computeManagerStats', () => {
  it('agrège audits et tâches', () => {
    const stats = computeManagerStats(
      [
        audit({ id: 'a1', status: 'completed', score: 80 }),
        audit({ id: 'a2', status: 'pending', score: 60 }),
        audit({ id: 'a3', status: 'in_progress' }),
      ],
      [
        task({ id: 't1', status: 'pending', priority: 'high' }),
        task({ id: 't2', status: 'completed', priority: 'low' }),
      ],
    );
    expect(stats.totalAudits).toBe(3);
    expect(stats.completedAudits).toBe(1);
    expect(stats.avgScore).toBe(70);
    expect(stats.highPriorityTasks).toBe(1);
    expect(stats.completedTasks).toBe(1);
  });
});

describe('computeStoreStats', () => {
  it('calcule le score moyen par magasin', () => {
    const stores = [{ id: 's1', name: 'Magasin 1' }] as Store[];
    const result = computeStoreStats(stores, [
      audit({ id: 'a1', store_id: 's1', status: 'completed', score: 90 }),
      audit({ id: 'a2', store_id: 's1', status: 'completed', score: 70 }),
      audit({ id: 'a3', store_id: 's1', status: 'pending' }),
    ]);
    expect(result[0]?.total).toBe(3);
    expect(result[0]?.completed).toBe(2);
    expect(result[0]?.avg).toBe(80);
  });
});

describe('getUrgentTasks', () => {
  it('garde les tâches prioritaires non terminées (max 5)', () => {
    const tasks = [
      task({ id: '1', priority: 'high', status: 'pending' }),
      task({ id: '2', priority: 'high', status: 'completed' }),
      task({ id: '3', priority: 'low', status: 'pending' }),
    ];
    expect(getUrgentTasks(tasks).map((t) => t.id)).toEqual(['1']);
  });
});

describe('getScoreChip', () => {
  it('choisit la couleur selon le score', () => {
    expect(getScoreChip(null).label).toBe('—');
    expect(getScoreChip(85).color).toBe('#16A34A');
    expect(getScoreChip(65).color).toBe('#D97706');
    expect(getScoreChip(40).color).toBe('#DC2626');
  });
});
