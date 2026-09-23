import { describe, it, expect } from 'vitest';

import { isManagerRole } from '../../utils/roles';

describe('isManagerRole', () => {
  it('reconnaît manager et admin', () => {
    expect(isManagerRole('manager')).toBe(true);
    expect(isManagerRole('admin')).toBe(true);
    expect(isManagerRole('superadmin')).toBe(true);
  });

  it('rejette les autres rôles et les valeurs vides', () => {
    expect(isManagerRole('employé')).toBe(false);
    expect(isManagerRole('stagiaire')).toBe(false);
    expect(isManagerRole(null)).toBe(false);
    expect(isManagerRole(undefined)).toBe(false);
  });
});
