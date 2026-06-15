import { afterEach, describe, expect, it } from 'vitest';

import {
  getDemoOrgTrainingProgress,
  getDemoTrainings,
} from '../../lib/demoData';
import {
  getDemoState,
  resetDemoStore,
  updateDemoCollection,
} from '../../lib/demoStore';

afterEach(() => {
  resetDemoStore();
});

describe('demo store', () => {
  it('expose un état initial complet', () => {
    const state = getDemoState();
    expect(state.audits.length).toBeGreaterThan(0);
    expect(state.trainings.length).toBeGreaterThan(0);
    expect(state.trainingCertificates).toEqual([]);
  });

  it('applique une mutation immuable et la rend visible globalement', () => {
    const before = getDemoState().actions.length;
    updateDemoCollection('actions', (current) => [
      ...current,
      { ...current[0]!, id: 'test-action-new' },
    ]);
    expect(getDemoState().actions.length).toBe(before + 1);
    expect(getDemoState().actions.some((a) => a.id === 'test-action-new')).toBe(
      true,
    );
  });

  it('réinitialise le store aux données de départ', () => {
    updateDemoCollection('tasks', () => []);
    expect(getDemoState().tasks).toEqual([]);
    resetDemoStore();
    expect(getDemoState().tasks.length).toBeGreaterThan(0);
  });
});

describe('intégrité du jeu de données démo', () => {
  it('chaque progression de formation référence une formation existante', () => {
    const trainingIds = new Set(getDemoTrainings().map((t) => t.id));
    for (const prog of getDemoOrgTrainingProgress()) {
      expect(trainingIds.has(prog.training_id)).toBe(true);
    }
  });

  it('les scores des formations terminées restent dans 0–100', () => {
    for (const prog of getDemoOrgTrainingProgress()) {
      if (prog.status === 'completed' && prog.score != null) {
        expect(prog.score).toBeGreaterThanOrEqual(0);
        expect(prog.score).toBeLessThanOrEqual(100);
      }
    }
  });
});
