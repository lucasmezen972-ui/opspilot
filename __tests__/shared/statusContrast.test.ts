import { describe, expect, it } from 'vitest';

import { colors, statusPalette } from '../../shared/styles/tokens';

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}
function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}
describe('lisibilité des textes de statut partagés', () => {
  for (const [level, pair] of Object.entries(statusPalette)) {
    it(`garde le texte ${level} à au moins 4,5:1 sur son fond`, () => {
      expect(contrast(pair.fg, pair.bg)).toBeGreaterThanOrEqual(4.5);
    });
  }
  it('garde les libellés blancs lisibles sur les actions partagées', () => {
    for (const background of [
      colors.primary,
      colors.trustGreen,
      colors.dangerStrong,
    ]) {
      expect(contrast('#FFFFFF', background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
