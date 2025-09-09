export enum Role {
  Manager = 'manager',
  Employee = 'employee',
}

const permissions: Record<Role, string[]> = {
  [Role.Manager]: ['read', 'write'],
  [Role.Employee]: ['read'],
};

export function hasPermission(role: Role, permission: string): boolean {
  return permissions[role]?.includes(permission) ?? false;
}
