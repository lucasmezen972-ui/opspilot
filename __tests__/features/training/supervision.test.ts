import { describe, expect, it } from 'vitest';

import {
  computeSupervisionStats,
  deriveMatricule,
  type MemberTrainingStatus,
} from '../../../features/training/trainingModel';

function entry(
  overrides: Partial<MemberTrainingStatus> = {},
): MemberTrainingStatus {
  return {
    memberId: 'm1',
    memberName: 'Jean Martin',
    memberRole: 'employé',
    matricule: 'M-0001',
    trainingId: 't1',
    trainingTitle: 'Hygiène HACCP',
    status: 'completed',
    score: 90,
    completedAt: '2026-06-01T10:00:00.000Z',
    hasCertificate: true,
    ...overrides,
  };
}

describe('deriveMatricule', () => {
  it('produit un matricule stable et déterministe', () => {
    expect(deriveMatricule('demo-member-2')).toBe(
      deriveMatricule('demo-member-2'),
    );
  });

  it('respecte le format M-XXXX', () => {
    expect(deriveMatricule('demo-member-3')).toMatch(/^M-\d{4}$/);
  });

  it('distingue des identifiants différents', () => {
    expect(deriveMatricule('demo-member-2')).not.toBe(
      deriveMatricule('demo-member-5'),
    );
  });
});

describe('computeSupervisionStats', () => {
  it('agrège complétion, score moyen et certifications', () => {
    const stats = computeSupervisionStats([
      entry({ memberId: 'm1', status: 'completed', score: 90 }),
      entry({
        memberId: 'm2',
        status: 'in_progress',
        score: null,
        hasCertificate: false,
      }),
      entry({
        memberId: 'm3',
        status: 'not_started',
        score: null,
        hasCertificate: false,
      }),
    ]);
    expect(stats.completedCount).toBe(1);
    expect(stats.inProgressCount).toBe(1);
    expect(stats.notStartedCount).toBe(1);
    expect(stats.completionRate).toBe(33);
    expect(stats.avgScore).toBe(90);
    expect(stats.certifiedCount).toBe(1);
  });
});
