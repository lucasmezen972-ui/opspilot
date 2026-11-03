import { describe, it, expect } from 'vitest';

import {
  PLANS,
  SALES_CONTACT_EMAIL,
  buildActivationMailtoUrl,
  getStatusInfo,
  formatPlanName,
  getPlanState,
} from '../../features/billing/billingModel';

describe('getStatusInfo', () => {
  it('mappe les statuts connus sans présenter un statut inconnu comme un essai', () => {
    expect(getStatusInfo('active').label).toBe('Actif');
    expect(getStatusInfo('past_due').color).toBe('#DC2626');
    expect(getStatusInfo('inconnu')).toEqual({
      label: 'Statut à vérifier',
      color: '#6B7280',
    });
  });
});

describe('formatPlanName', () => {
  it('capitalise le nom du plan', () => {
    expect(formatPlanName('trial')).toBe('Essai');
    expect(formatPlanName('business')).toBe('Business');
  });
});

describe('getPlanState', () => {
  it('permet de souscrire Essential pendant l’essai', () => {
    expect(getPlanState('essential', 'trial')).toEqual({
      isCurrent: false,
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

  it('réserve Enterprise au devis/contact (pas de prix self-service)', () => {
    const enterprise = PLANS.find((p) => p.id === 'enterprise');
    expect(enterprise?.price).toBe('Sur devis');
    expect(enterprise?.period).toBe('');
  });
});

describe('buildActivationMailtoUrl', () => {
  it('fournit une alternative claire (mailto pré-rempli) au paiement', () => {
    const url = buildActivationMailtoUrl('business');
    expect(url.startsWith(`mailto:${SALES_CONTACT_EMAIL}`)).toBe(true);
    expect(url).toContain('subject=');
    expect(url).toContain('business');
    // L'adresse de contact reste la nouvelle adresse, sans secret en dur.
    expect(SALES_CONTACT_EMAIL).toBe('contact@tradikom.com');
  });
});
