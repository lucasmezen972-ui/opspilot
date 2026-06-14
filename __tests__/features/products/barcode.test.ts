import { describe, expect, it } from 'vitest';

import {
  normalizeBarcode,
  isValidGtinChecksum,
  validateBarcode,
} from '../../../features/products/barcode';

describe('normalizeBarcode', () => {
  it('supprime les espaces saisis ou lus par la caméra', () => {
    expect(normalizeBarcode(' 3000 0000 0000 1 ')).toBe('3000000000001');
  });

  it('retourne une chaîne vide pour une saisie sans code', () => {
    expect(normalizeBarcode(' \n\t ')).toBe('');
  });
});

describe('isValidGtinChecksum', () => {
  it('valide des codes EAN-13 / EAN-8 corrects', () => {
    expect(isValidGtinChecksum('4006381333931')).toBe(true); // EAN-13
    expect(isValidGtinChecksum('96385074')).toBe(true); // EAN-8
  });

  it('rejette un chiffre de contrôle erroné ou une longueur invalide', () => {
    expect(isValidGtinChecksum('4006381333930')).toBe(false);
    expect(isValidGtinChecksum('123')).toBe(false);
  });
});

describe('validateBarcode', () => {
  it('refuse une saisie vide', () => {
    expect(validateBarcode('   ').valid).toBe(false);
  });

  it('vérifie le chiffre de contrôle des codes numériques GTIN', () => {
    expect(validateBarcode('4006381333931').valid).toBe(true);
    const bad = validateBarcode('4006381333930');
    expect(bad.valid).toBe(false);
    expect(bad.reason).toMatch(/contrôle/i);
  });

  it('signale une longueur numérique inattendue', () => {
    expect(validateBarcode('12345').reason).toMatch(/[Ll]ongueur/);
  });

  it('accepte un code alphanumérique (Code 128 / QR) sans somme de contrôle', () => {
    expect(validateBarcode('ABC-128-XYZ').valid).toBe(true);
  });
});
