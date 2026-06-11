import { describe, expect, it } from 'vitest';

import { normalizeBarcode } from '../../../features/products/barcode';

describe('normalizeBarcode', () => {
  it('supprime les espaces saisis ou lus par la caméra', () => {
    expect(normalizeBarcode(' 3000 0000 0000 1 ')).toBe('3000000000001');
  });

  it('retourne une chaîne vide pour une saisie sans code', () => {
    expect(normalizeBarcode(' \n\t ')).toBe('');
  });
});
