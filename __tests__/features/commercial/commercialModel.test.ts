import { describe, expect, it } from 'vitest';

import {
  buildCommercialMailto,
  COMMERCIAL_CONTACT_EMAIL,
  COMMERCIAL_PLANS,
  hasNoDeadCommercialCta,
} from '../../../features/commercial/commercialModel';

describe('commercialModel', () => {
  it('expose trois offres vendables sans bouton mort', () => {
    expect(COMMERCIAL_PLANS.map((plan) => plan.id)).toEqual([
      'starter',
      'pro',
      'franchise',
    ]);
    expect(hasNoDeadCommercialCta()).toBe(true);
  });

  it('chaque offre contient limites, bénéfices et CTA commercial', () => {
    for (const plan of COMMERCIAL_PLANS) {
      expect(plan.name.trim().length).toBeGreaterThan(0);
      expect(plan.price.trim().length).toBeGreaterThan(0);
      expect(plan.limits.length).toBeGreaterThanOrEqual(4);
      expect(plan.highlights.length).toBeGreaterThanOrEqual(3);
      expect(plan.cta).toMatch(/Démo|devis/i);
    }
  });

  it('positionne les offres sur une valeur métier claire', () => {
    expect(COMMERCIAL_PLANS.map((plan) => plan.target)).toEqual([
      'sécuriser 1 magasin',
      'piloter plusieurs sites',
      'prouver la conformité d’un réseau',
    ]);
  });

  it('génère un mailto exploitable vers contact@tradikom.com', () => {
    const mailto = buildCommercialMailto('pro');
    expect(mailto.startsWith(`mailto:${COMMERCIAL_CONTACT_EMAIL}`)).toBe(true);
    expect(mailto).toContain('Offre%20Pro');
    expect(mailto).toContain('Nombre%20de%20magasins');
  });
});
