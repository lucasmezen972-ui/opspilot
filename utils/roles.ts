export enum Role {
  Admin = 'admin',
  Manager = 'manager',
  Employee = 'employee',
  Employe = 'employé',
  Stagiaire = 'stagiaire',
}

const permissions: Record<Role, string[]> = {
  [Role.Admin]: ['read', 'write', 'delete', 'manage_users'],
  [Role.Manager]: ['read', 'write', 'delete'],
  [Role.Employee]: ['read', 'write'],
  [Role.Employe]: ['read', 'write'],
  [Role.Stagiaire]: ['read'],
};

export function hasPermission(role: string, permission: string): boolean {
  return permissions[role as Role]?.includes(permission) ?? false;
}

export function isManagerOrAdmin(role: string | undefined): boolean {
  return role === Role.Admin || role === Role.Manager;
}
