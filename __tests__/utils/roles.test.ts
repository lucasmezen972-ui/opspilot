import { describe, it, expect } from 'vitest';

import { Role, hasPermission } from '../../utils/roles';

describe('roles', () => {
  it('manager has write permission', () => {
    expect(hasPermission(Role.Manager, 'write')).toBe(true);
  });

  it('employee lacks write permission', () => {
    expect(hasPermission(Role.Employee, 'write')).toBe(false);
  });
});
