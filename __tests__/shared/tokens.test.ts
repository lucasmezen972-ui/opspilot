import { describe, it, expect } from 'vitest';

import {
  statusPalette,
  riskPalette,
  zIndex,
  colors,
  spacing,
} from '../../shared/styles/tokens';

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

  it('expose une palette de risque (couleurs + libellé) par niveau', () => {
    for (const level of ['critical', 'high', 'medium', 'low'] as const) {
      expect(riskPalette[level].fg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(riskPalette[level].bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(riskPalette[level].label.length).toBeGreaterThan(0);
    }
  });

  it("fournit une échelle de z-index ordonnée du contenu vers l'avant", () => {
    expect(zIndex.base).toBeLessThan(zIndex.dropdown);
    expect(zIndex.overlay).toBeLessThan(zIndex.modal);
    expect(zIndex.modal).toBeLessThan(zIndex.toast);
  });
});
