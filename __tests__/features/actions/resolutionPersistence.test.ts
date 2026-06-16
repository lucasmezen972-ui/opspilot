import { afterEach, describe, expect, it } from 'vitest';

import { buildResolutionRecord } from '../../../features/actions/actionResolution';
import {
  getDemoState,
  resetDemoStore,
  updateDemoCollection,
} from '../../../lib/demoStore';

/**
 * Vérifie que les preuves de clôture contrôlée sont réellement PERSISTÉES
 * (et relisibles) dans le store démo — le même mécanisme que celui branché sur
 * Supabase hors mode démo via updateActionStatus(id, 'done', record).
 */

afterEach(() => {
  resetDemoStore();
});

describe('persistance des preuves de clôture (mode démo)', () => {
  it('les actions démo déjà résolues portent des preuves traçables', () => {
    const done = getDemoState().actions.filter((a) => a.status === 'done');
    expect(done.length).toBeGreaterThan(0);

    const withEvidence = done.filter(
      (a) => a.resolved_by_name && a.resolution_comment,
    );
    expect(withEvidence.length).toBeGreaterThan(0);
    for (const a of withEvidence) {
      expect(typeof a.manager_validated).toBe('boolean');
      expect(typeof a.resolution_photo_confirmed).toBe('boolean');
    }
  });

  it('enregistre puis relit une clôture contrôlée', () => {
    const target = getDemoState().actions.find((a) => a.status !== 'done');
    expect(target).toBeDefined();

    const record = buildResolutionRecord(
      {
        comment: 'Produits retirés et zone nettoyée.',
        employeeName: 'Marie Dupont',
        employeeId: 'M-1042',
        photoConfirmed: true,
        managerValidated: true,
      },
      { id: 'demo-user', role: 'manager' },
    );

    updateDemoCollection('actions', (prev) =>
      prev.map((a) =>
        a.id === target!.id
          ? {
              ...a,
              status: 'done',
              resolved_at: new Date().toISOString(),
              ...record,
            }
          : a,
      ),
    );

    const stored = getDemoState().actions.find((a) => a.id === target!.id);
    expect(stored?.status).toBe('done');
    expect(stored?.resolution_comment).toBe(
      'Produits retirés et zone nettoyée.',
    );
    expect(stored?.resolved_by_name).toBe('Marie Dupont');
    expect(stored?.resolved_by_matricule).toBe('M-1042');
    expect(stored?.resolution_photo_confirmed).toBe(true);
    expect(stored?.manager_validated).toBe(true);
    expect(stored?.resolved_by).toBe('demo-user');
    expect(stored?.resolver_role).toBe('manager');
  });
});
