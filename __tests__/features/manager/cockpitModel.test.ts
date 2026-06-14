import { describe, it, expect } from 'vitest';

import {
  buildCockpitRisks,
  cockpitHealth,
  computeCockpitSignals,
} from '../../../features/manager/cockpitModel';
import type { Audit, CorrectiveAction, Task } from '../../../lib/supabase';

const NOW = new Date('2026-06-14T12:00:00Z').getTime();
const past = new Date('2026-06-10T12:00:00Z').toISOString();
const future = new Date('2026-06-20T12:00:00Z').toISOString();

const audit = (over: Partial<Audit>): Audit =>
  ({
    id: 'a',
    organization_id: 'o',
    auditor_id: 'u',
    title: 'Audit',
    status: 'pending',
    max_score: 100,
    issues_count: 0,
    photos: [],
    created_at: past,
    updated_at: past,
    ...over,
  }) as Audit;

const action = (over: Partial<CorrectiveAction>): CorrectiveAction =>
  ({
    id: 'c',
    organization_id: 'o',
    title: 'Action',
    priority: 'medium',
    status: 'open',
    ...over,
  }) as CorrectiveAction;

const task = (over: Partial<Task>): Task =>
  ({
    id: 't',
    organization_id: 'o',
    title: 'Task',
    priority: 'low',
    status: 'pending',
    ...over,
  }) as Task;

describe('computeCockpitSignals', () => {
  it('calcule le score de conformité sur les audits clôturés notés', () => {
    const signals = computeCockpitSignals({
      audits: [
        audit({ status: 'completed', score: 80 }),
        audit({ status: 'completed', score: 90 }),
        audit({ status: 'pending', score: 10 }),
      ],
      actions: [],
      tasks: [],
      trainingGaps: 0,
      unreadMessages: 0,
      now: NOW,
    });
    expect(signals.conformityScore).toBe(85);
    expect(signals.scoredAuditCount).toBe(2);
  });

  it('compte les retards, actions critiques et tâches', () => {
    const signals = computeCockpitSignals({
      audits: [audit({ status: 'in_progress', due_date: past })],
      actions: [
        action({ priority: 'critical', status: 'open' }),
        action({ priority: 'medium', status: 'in_progress' }),
        action({ priority: 'high', status: 'done' }),
      ],
      tasks: [
        task({ status: 'pending', due_date: past }),
        task({ status: 'in_progress', due_date: future }),
        task({ status: 'completed' }),
      ],
      trainingGaps: 4,
      unreadMessages: 3,
      now: NOW,
    });
    expect(signals.overdueAudits).toBe(1);
    expect(signals.criticalActions).toBe(1);
    expect(signals.openActions).toBe(2);
    expect(signals.overdueTasks).toBe(1);
    expect(signals.incompleteTasks).toBe(2);
    expect(signals.trainingGaps).toBe(4);
    expect(signals.unreadMessages).toBe(3);
  });
});

describe('buildCockpitRisks', () => {
  it('priorise les risques critiques en premier', () => {
    const risks = buildCockpitRisks(
      computeCockpitSignals({
        audits: [audit({ status: 'in_progress', due_date: past })],
        actions: [action({ priority: 'critical', status: 'open' })],
        tasks: [],
        trainingGaps: 2,
        unreadMessages: 1,
        now: NOW,
      }),
    );
    expect(risks[0]?.severity).toBe('critical');
    expect(risks[0]?.id).toBe('critical-actions');
    // L'ordre est non croissant en sévérité.
    const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    for (let i = 1; i < risks.length; i += 1) {
      expect(rank[risks[i]!.severity]).toBeGreaterThanOrEqual(
        rank[risks[i - 1]!.severity],
      );
    }
  });

  it('ne renvoie aucun risque quand tout est sous contrôle', () => {
    const risks = buildCockpitRisks(
      computeCockpitSignals({
        audits: [audit({ status: 'completed', score: 95 })],
        actions: [],
        tasks: [],
        trainingGaps: 0,
        unreadMessages: 0,
        now: NOW,
      }),
    );
    expect(risks).toHaveLength(0);
  });
});

describe('cockpitHealth', () => {
  it('qualifie le score de conformité', () => {
    expect(cockpitHealth(95).label).toBe('Excellent');
    expect(cockpitHealth(82).severity).toBe('low');
    expect(cockpitHealth(72).severity).toBe('medium');
    expect(cockpitHealth(50).severity).toBe('critical');
    expect(cockpitHealth(0).label).toBe('Aucune donnée');
  });
});
