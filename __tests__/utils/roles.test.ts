import { describe, it, expect } from 'vitest';

import { Role, hasPermission, isManagerOrAdmin } from '../../utils/roles';

describe('roles', () => {
  it('manager has write permission', () => {
    expect(hasPermission(Role.Manager, 'write')).toBe(true);
  });

  it('admin has manage_users permission', () => {
    expect(hasPermission(Role.Admin, 'manage_users')).toBe(true);
  });

  it('employee has write but not delete', () => {
    expect(hasPermission(Role.Employee, 'write')).toBe(true);
    expect(hasPermission(Role.Employee, 'delete')).toBe(false);
  });

  it('stagiaire only has read', () => {
    expect(hasPermission(Role.Stagiaire, 'read')).toBe(true);
    expect(hasPermission(Role.Stagiaire, 'write')).toBe(false);
  });

  it('isManagerOrAdmin works correctly', () => {
    expect(isManagerOrAdmin('admin')).toBe(true);
    expect(isManagerOrAdmin('manager')).toBe(true);
    expect(isManagerOrAdmin('employee')).toBe(false);
    expect(isManagerOrAdmin(undefined)).toBe(false);
  });
});
