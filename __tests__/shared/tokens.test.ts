import { describe, it, expect } from 'vitest';

import { statusPalette, colors, spacing } from '../../shared/styles/tokens';

describe('design tokens', () => {
  it('expose un foreground et un background pour chaque niveau de statut', () => {
    for (const level of ['success', 'warning', 'danger', 'neutral'] as const) {
      expect(statusPalette[level].fg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(statusPalette[level].bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('conserve la couleur de marque OpsPilot', () => {
    expect(colors.primary).toBe('#2563EB');
  });

  it("fournit une échelle d'espacement croissante", () => {
    expect(spacing.xs).toBeLessThan(spacing.sm);
    expect(spacing.sm).toBeLessThan(spacing.lg);
  });
});
