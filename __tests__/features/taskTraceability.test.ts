import { describe, it, expect } from 'vitest';

import {
  canValidateTask,
  computeDurationMinutes,
  executionProofSummary,
  isCompletionValid,
  isTaskValidated,
} from '../../features/tasks/taskTraceability';
import type { Task } from '../../lib/supabase';

const task = (over: Partial<Task>): Task =>
  ({
    id: 't',
    organization_id: 'o',
    title: 'Tâche',
    priority: 'low',
    status: 'completed',
    ...over,
  }) as Task;

describe('computeDurationMinutes', () => {
  it('calcule la durée en minutes entre début et fin', () => {
    const start = '2026-06-15T08:00:00Z';
    const end = '2026-06-15T08:25:00Z';
    expect(computeDurationMinutes(start, end)).toBe(25);
  });

  it('renvoie 0 si les bornes manquent ou sont incohérentes', () => {
    expect(computeDurationMinutes(null, '2026-06-15T08:25:00Z')).toBe(0);
    expect(computeDurationMinutes('2026-06-15T08:25:00Z', null)).toBe(0);
    expect(
      computeDurationMinutes('2026-06-15T09:00:00Z', '2026-06-15T08:00:00Z'),
    ).toBe(0);
  });
});

describe('isCompletionValid', () => {
  it('exige un nom et un matricule', () => {
    expect(
      isCompletionValid({ executantName: 'Marie', matricule: 'M-1' }),
    ).toBe(true);
    expect(isCompletionValid({ executantName: '', matricule: 'M-1' })).toBe(
      false,
    );
    expect(isCompletionValid({ executantName: 'Marie', matricule: '  ' })).toBe(
      false,
    );
  });
});

describe('validation manager', () => {
  it('isTaskValidated reflète validated_at', () => {
    expect(isTaskValidated(task({ validated_at: null }))).toBe(false);
    expect(
      isTaskValidated(task({ validated_at: '2026-06-15T10:00:00Z' })),
    ).toBe(true);
  });

  it('canValidateTask : terminée et non encore validée', () => {
    expect(
      canValidateTask(task({ status: 'completed', validated_at: null })),
    ).toBe(true);
    expect(
      canValidateTask(
        task({ status: 'completed', validated_at: '2026-06-15T10:00:00Z' }),
      ),
    ).toBe(false);
    expect(
      canValidateTask(task({ status: 'in_progress', validated_at: null })),
    ).toBe(false);
  });
});

describe('executionProofSummary', () => {
  it('résume nom, matricule et durée', () => {
    const summary = executionProofSummary(
      task({
        completed_by_name: 'Marie Dupont',
        completed_by_matricule: 'M-1042',
        duration_minutes: 9,
      }),
    );
    expect(summary).toBe('Marie Dupont · mat. M-1042 · 9 min');
  });

  it('omet la durée nulle', () => {
    const summary = executionProofSummary(
      task({ completed_by_name: 'Jean', duration_minutes: 0 }),
    );
    expect(summary).toBe('Jean');
  });
});
