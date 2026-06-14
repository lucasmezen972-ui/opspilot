import { describe, it, expect } from 'vitest';

import { can, permissionsForRole } from '../../utils/permissions';

describe('permissions', () => {
  it('le manager peut exporter et superviser, pas accéder au back-office', () => {
    expect(can('manager', 'reports.export')).toBe(true);
    expect(can('manager', 'training.supervise')).toBe(true);
    expect(can('manager', 'backoffice.access')).toBe(false);
    expect(can('manager', 'billing.manage')).toBe(false);
  });

  it("l'admin et l'owner ont les droits de gouvernance", () => {
    expect(can('admin', 'backoffice.access')).toBe(true);
    expect(can('admin', 'settings.manage')).toBe(true);
    expect(can('owner', 'billing.manage')).toBe(true);
  });

  it('le superadmin a toutes les permissions', () => {
    expect(can('superadmin', 'audit.delete')).toBe(true);
    expect(can('superadmin', 'billing.manage')).toBe(true);
  });

  it("l'employé reste sur les actions terrain, sans export", () => {
    expect(can('employé', 'audit.create')).toBe(true);
    expect(can('employé', 'reports.export')).toBe(false);
    expect(can('employee', 'reports.export')).toBe(false);
  });

  it('le support est en lecture seule', () => {
    expect(can('support', 'reports.view')).toBe(true);
    expect(can('support', 'backoffice.access')).toBe(true);
    expect(can('support', 'audit.create')).toBe(false);
  });

  it('le stagiaire et les rôles inconnus/vides n’ont aucune permission', () => {
    expect(can('stagiaire', 'audit.create')).toBe(false);
    expect(can('inconnu', 'reports.view')).toBe(false);
    expect(can(null, 'reports.view')).toBe(false);
    expect(can(undefined, 'reports.view')).toBe(false);
  });

  it('permissionsForRole renvoie une copie défensive', () => {
    const perms = permissionsForRole('manager');
    expect(perms).toContain('reports.export');
    perms.pop();
    expect(permissionsForRole('manager')).toContain('reports.export');
  });
});
