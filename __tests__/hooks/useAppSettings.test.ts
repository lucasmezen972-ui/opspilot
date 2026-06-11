import { describe, it, expect } from 'vitest';

import { isFeatureEnabled } from '../../hooks/useAppSettings';

describe('isFeatureEnabled', () => {
  it('active par défaut quand aucun réglage', () => {
    expect(isFeatureEnabled({}, 'features.reports')).toBe(true);
  });

  it('active quand enabled: true', () => {
    expect(
      isFeatureEnabled(
        { 'features.reports': { enabled: true } },
        'features.reports',
      ),
    ).toBe(true);
  });

  it('désactive uniquement sur enabled: false explicite', () => {
    expect(
      isFeatureEnabled(
        { 'features.reports': { enabled: false } },
        'features.reports',
      ),
    ).toBe(false);
  });

  it('valeur sans clé enabled = activé', () => {
    expect(
      isFeatureEnabled({ 'features.reports': {} }, 'features.reports'),
    ).toBe(true);
  });
});
