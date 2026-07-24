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

/**
 * Rôles disposant des fonctions d'encadrement (supervision, modération,
 * gestion d'équipe). Source de vérité unique pour les gardes d'UI manager.
 */
export function isManagerRole(role?: string | null): boolean {
  return role === 'manager' || role === 'admin' || role === 'superadmin';
}
