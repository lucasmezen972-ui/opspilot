import { describe, expect, it } from 'vitest';

import {
  normalizePhone,
  validateNewPassword,
  validateProfileSettings,
} from '../../../features/settings/preferences';

describe('réglages utilisateur', () => {
  it('normalise le téléphone sans inventer de valeur', () => {
    expect(normalizePhone('  +33  6  12 34 56 78 ')).toBe('+33 6 12 34 56 78');
    expect(normalizePhone('   ')).toBeNull();
  });

  it('refuse un nom trop court', () => {
    expect(validateProfileSettings('A')).toContain('2 caractères');
    expect(validateProfileSettings('Alice Martin')).toBeNull();
  });

  it('exige un mot de passe robuste et confirmé', () => {
    expect(validateNewPassword('court', 'court')).toContain('8 caractères');
    expect(validateNewPassword('motdepasse', 'différent')).toContain(
      'ne correspondent pas',
    );
    expect(validateNewPassword('motdepasse', 'motdepasse')).toBeNull();
  });
});
