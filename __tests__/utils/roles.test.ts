import { describe, it, expect } from 'vitest';

import { Role, hasPermission, isManagerRole } from '../../utils/roles';

describe('roles', () => {
  it('manager has write permission', () => {
    expect(hasPermission(Role.Manager, 'write')).toBe(true);
  });

  it('employee lacks write permission', () => {
    expect(hasPermission(Role.Employee, 'write')).toBe(false);
  });
});

describe('isManagerRole', () => {
  it('reconnaît manager et admin', () => {
    expect(isManagerRole('manager')).toBe(true);
    expect(isManagerRole('admin')).toBe(true);
  });

  it('rejette les autres rôles et les valeurs vides', () => {
    expect(isManagerRole('employé')).toBe(false);
    expect(isManagerRole('stagiaire')).toBe(false);
    expect(isManagerRole(null)).toBe(false);
    expect(isManagerRole(undefined)).toBe(false);
  });
});
