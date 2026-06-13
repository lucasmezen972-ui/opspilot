import { describe, it, expect } from 'vitest';

import { mapSupabaseError, genericMessages } from '../../utils/error';

describe('mapSupabaseError', () => {
  it('traduit les identifiants invalides', () => {
    expect(
      mapSupabaseError('t', { message: 'Invalid login credentials' }),
    ).toBe('Email ou mot de passe incorrect.');
  });

  it('traduit une erreur réseau', () => {
    expect(mapSupabaseError('t', { message: 'Failed to fetch' })).toMatch(
      /Connexion indisponible/,
    );
  });

  it('traduit un refus de droits (RLS)', () => {
    expect(
      mapSupabaseError('t', { message: 'new row violates row-level security' }),
    ).toMatch(/droits/);
  });

  it("n'expose pas un message technique inconnu", () => {
    expect(
      mapSupabaseError('t', { message: 'PGRST116 some internal detail' }),
    ).toBe(genericMessages.supabase);
  });
});
