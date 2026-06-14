export function normalizeBarcode(value: string): string {
  return value.replace(/\s+/g, '').trim();
}

/** Longueurs GTIN reconnues (EAN-8, UPC-A, EAN-13, GTIN-14). */
const GTIN_LENGTHS = new Set([8, 12, 13, 14]);

/**
 * Vérifie le chiffre de contrôle GTIN (EAN-8/13, UPC-A, GTIN-14).
 * Algorithme standard : pondération 3/1 depuis le dernier chiffre de données.
 */
export function isValidGtinChecksum(code: string): boolean {
  if (!/^\d+$/.test(code) || !GTIN_LENGTHS.has(code.length)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 3 : 1), 0);
  const computed = (10 - (sum % 10)) % 10;
  return computed === check;
}

export interface BarcodeValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Valide un code-barres saisi manuellement.
 * - vide → invalide ;
 * - numérique de longueur GTIN → vérifie le chiffre de contrôle ;
 * - numérique de longueur inattendue → invalide ;
 * - alphanumérique (Code 128, QR…) → accepté (pas de somme de contrôle).
 */
export function validateBarcode(value: string): BarcodeValidation {
  const code = normalizeBarcode(value);
  if (!code) return { valid: false, reason: 'Saisissez un code-barres.' };

  if (/^\d+$/.test(code)) {
    if (!GTIN_LENGTHS.has(code.length)) {
      return {
        valid: false,
        reason: 'Longueur de code-barres invalide (8, 12, 13 ou 14 chiffres).',
      };
    }
    if (!isValidGtinChecksum(code)) {
      return { valid: false, reason: 'Chiffre de contrôle invalide.' };
    }
  }

  return { valid: true };
}
