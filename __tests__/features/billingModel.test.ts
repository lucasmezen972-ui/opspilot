import { describe, it, expect } from 'vitest';

import {
  PLANS,
  getStatusInfo,
  formatPlanName,
  getPlanState,
} from '../../features/billing/billingModel';

describe('getStatusInfo', () => {
  it('mappe les statuts connus et retombe sur l’essai gratuit', () => {
    expect(getStatusInfo('active').label).toBe('Actif');
    expect(getStatusInfo('past_due').color).toBe('#DC2626');
    expect(getStatusInfo('inconnu')).toEqual({
      label: 'Essai gratuit',
      color: '#2563EB',
    });
  });
});

describe('formatPlanName', () => {
  it('capitalise le nom du plan', () => {
    expect(formatPlanName('trial')).toBe('Trial');
    expect(formatPlanName('business')).toBe('Business');
  });
});

describe('getPlanState', () => {
  it('traite l’essai comme équivalent au plan Essential', () => {
    expect(getPlanState('essential', 'trial')).toEqual({
      isCurrent: true,
      isDowngrade: false,
    });
  });

  it('détecte une rétrogradation', () => {
    expect(getPlanState('essential', 'business')).toEqual({
      isCurrent: false,
      isDowngrade: true,
    });
  });

  it('détecte une montée en gamme', () => {
    expect(getPlanState('enterprise', 'business')).toEqual({
      isCurrent: false,
      isDowngrade: false,
    });
  });
});

describe('PLANS', () => {
  it('expose les trois offres', () => {
    expect(PLANS.map((p) => p.id)).toEqual([
      'essential',
      'business',
      'enterprise',
    ]);
  });
});
